"""
Core chat downloader module.

Handles downloading chat from YouTube live streams and VODs with:
- Rate limit handling with exponential backoff
- Support for both live and archived streams
- Memory-efficient streaming processing
- Resume support for interrupted downloads
"""

import logging
import signal
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

from chat_downloader import ChatDownloader as BaseChatDownloader
from chat_downloader.errors import (
    ChatDownloaderError,
    NoChatReplay,
    VideoUnavailable,
)
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)
from tqdm import tqdm

from lgl_chat_downloader.config import DownloaderConfig, StreamConfig
from lgl_chat_downloader.storage import (
    ChatMessage,
    CheckpointManager,
    StorageBackend,
    create_storage,
)

logger = logging.getLogger(__name__)


class DownloadStats:
    """Track download statistics."""

    def __init__(self):
        self.start_time = time.time()
        self.messages_downloaded = 0
        self.messages_per_second = 0.0
        self.errors = 0
        self.retries = 0
        self.last_message_time: datetime | None = None

    def update(self, messages_count: int) -> None:
        """Update stats with new message count."""
        self.messages_downloaded += messages_count
        elapsed = time.time() - self.start_time
        if elapsed > 0:
            self.messages_per_second = self.messages_downloaded / elapsed

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for logging/serialization."""
        return {
            "messages_downloaded": self.messages_downloaded,
            "messages_per_second": round(self.messages_per_second, 2),
            "errors": self.errors,
            "retries": self.retries,
            "elapsed_seconds": round(time.time() - self.start_time, 2),
        }


class StreamChatDownloader:
    """
    High-performance YouTube live stream chat downloader.

    Features:
    - Downloads chat from live or archived YouTube streams
    - Handles rate limits with automatic backoff
    - Memory-efficient streaming to disk
    - Resume support for interrupted downloads
    - Progress tracking and statistics
    """

    def __init__(self, config: DownloaderConfig | None = None):
        """
        Initialize the downloader.

        Args:
            config: Downloader configuration. Uses defaults if not provided.
        """
        self.config = config or DownloaderConfig()
        self._setup_logging()
        self._shutdown_requested = False
        self._current_storage: StorageBackend | None = None

        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _setup_logging(self) -> None:
        """Configure logging based on config."""
        from pythonjsonlogger import jsonlogger

        # Root logger for this package
        pkg_logger = logging.getLogger("lgl_chat_downloader")
        pkg_logger.setLevel(getattr(logging, self.config.log_level))

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        console_format = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        console_handler.setFormatter(console_format)
        pkg_logger.addHandler(console_handler)

        # File handler (JSON format for structured logging)
        if self.config.log_to_file:
            log_file = (
                self.config.log_dir
                / f"chat_downloader_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
            )
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setLevel(logging.DEBUG)
            json_format = jsonlogger.JsonFormatter(
                "%(asctime)s %(name)s %(levelname)s %(message)s"
            )
            file_handler.setFormatter(json_format)
            pkg_logger.addHandler(file_handler)
            logger.info(f"Logging to file: {log_file}")

    def _signal_handler(self, signum: int, frame: Any) -> None:
        """Handle shutdown signals gracefully."""
        signal_name = signal.Signals(signum).name
        logger.warning(f"Received {signal_name}, initiating graceful shutdown...")
        self._shutdown_requested = True

        # Flush storage if active
        if self._current_storage:
            logger.info("Flushing remaining messages to disk...")
            self._current_storage.flush()

    def _generate_output_filename(
        self,
        video_id: str,
        video_title: str | None = None,
    ) -> str:
        """Generate output filename from video info."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = ""
        if video_title:
            # Create filesystem-safe title
            safe_title = "".join(
                c if c.isalnum() or c in " -_" else "_" for c in video_title
            )[:50]
            safe_title = f"_{safe_title}"

        return f"{video_id}{safe_title}_{timestamp}"

    @retry(
        retry=retry_if_exception_type((ConnectionError, TimeoutError)),
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=2, max=60),
        before_sleep=lambda retry_state: logger.warning(
            f"Retrying after error (attempt {retry_state.attempt_number}): "
            f"{retry_state.outcome.exception()}"
        ),
    )
    def _fetch_chat_with_retry(
        self,
        url: str,
        start_time: str | None = None,
        end_time: str | None = None,
    ) -> Any:
        """
        Fetch chat data with automatic retry on transient failures.

        Uses exponential backoff to handle rate limits gracefully.
        """
        downloader = BaseChatDownloader()

        params = {
            "url": url,
            "message_groups": ["messages"],  # Focus on chat messages
        }

        # Add time range for VOD
        if start_time:
            params["start_time"] = start_time
        if end_time:
            params["end_time"] = end_time

        # Include additional message types if configured
        if self.config.include_superchat:
            params["message_groups"] = params.get("message_groups", []) + [
                "superchat"
            ]
        if self.config.include_membership:
            params["message_groups"] = params.get("message_groups", []) + [
                "membership"
            ]

        return downloader.get_chat(**params)

    def download(
        self,
        stream_config: StreamConfig,
        progress_callback: Callable[[DownloadStats], None] | None = None,
    ) -> DownloadStats:
        """
        Download chat from a YouTube stream.

        Args:
            stream_config: Configuration for the specific stream
            progress_callback: Optional callback for progress updates

        Returns:
            DownloadStats with download summary

        Raises:
            VideoUnavailable: If the video doesn't exist or is private
            NoChatReplay: If the video has no chat replay available
            ChatDownloaderError: For other download errors
        """
        stats = DownloadStats()
        video_id = stream_config.video_id

        logger.info(f"Starting chat download for video: {video_id}")
        logger.info(f"URL: {stream_config.url}")

        # Setup checkpoint manager for resume support
        checkpoint_manager = None
        resume_from_message = None
        if self.config.enable_resume:
            checkpoint_manager = CheckpointManager(
                self.config.output_dir / ".checkpoints",
                video_id,
            )
            existing_checkpoint = checkpoint_manager.load()
            if existing_checkpoint:
                resume_from_message = existing_checkpoint.get("last_message_id")
                stats.messages_downloaded = existing_checkpoint.get("message_count", 0)
                logger.info(
                    f"Resuming from checkpoint: {stats.messages_downloaded} messages"
                )

        # Determine output filename
        if stream_config.output_filename:
            base_filename = stream_config.output_filename
        else:
            base_filename = self._generate_output_filename(video_id)

        # Setup storage
        output_path = (
            self.config.output_dir
            / f"{base_filename}.{self.config.output_format}"
        )
        storage = create_storage(
            output_format=self.config.output_format,
            output_path=output_path,
            buffer_size=self.config.write_buffer_size,
            flush_interval=self.config.flush_interval_seconds,
        )
        self._current_storage = storage

        logger.info(f"Output file: {output_path}")

        try:
            # Fetch chat data
            logger.info("Connecting to YouTube chat...")
            chat = self._fetch_chat_with_retry(
                stream_config.url,
                stream_config.start_time,
                stream_config.end_time,
            )

            # Log video info if available
            if hasattr(chat, "title"):
                logger.info(f"Video title: {chat.title}")

            # Process messages with progress bar
            batch: list[ChatMessage] = []
            last_checkpoint_count = stats.messages_downloaded
            skip_until_resume = resume_from_message is not None

            # Use tqdm for progress display
            pbar = tqdm(
                desc="Downloading chat",
                unit=" msgs",
                dynamic_ncols=True,
                initial=stats.messages_downloaded,
            )

            for raw_message in chat:
                # Check for shutdown
                if self._shutdown_requested:
                    logger.warning("Shutdown requested, stopping download...")
                    break

                # Handle resume logic
                if skip_until_resume:
                    if raw_message.get("message_id") == resume_from_message:
                        skip_until_resume = False
                        logger.info("Reached resume point, continuing download...")
                    continue

                # Convert and store message
                message = ChatMessage(raw_message)
                batch.append(message)
                stats.messages_downloaded += 1
                stats.last_message_time = datetime.now()

                # Write batch
                if len(batch) >= self.config.write_buffer_size:
                    storage.write_batch(batch)
                    stats.update(len(batch))
                    pbar.update(len(batch))
                    batch.clear()

                    # Save checkpoint periodically
                    if (
                        checkpoint_manager
                        and stats.messages_downloaded - last_checkpoint_count
                        >= self.config.checkpoint_interval
                    ):
                        checkpoint_manager.save(
                            last_message_id=message.message_id,
                            last_timestamp=message.timestamp,
                            message_count=stats.messages_downloaded,
                        )
                        last_checkpoint_count = stats.messages_downloaded

                    # Progress callback
                    if progress_callback:
                        progress_callback(stats)

                # Rate limiting - small delay between processing
                if self.config.request_delay_ms > 0:
                    time.sleep(self.config.request_delay_ms / 1000.0)

            # Write remaining batch
            if batch:
                storage.write_batch(batch)
                stats.update(len(batch))
                pbar.update(len(batch))

            pbar.close()

        except NoChatReplay:
            logger.error(f"No chat replay available for video: {video_id}")
            raise
        except VideoUnavailable as e:
            logger.error(f"Video unavailable: {video_id} - {e}")
            raise
        except ChatDownloaderError as e:
            logger.error(f"Chat download error: {e}")
            stats.errors += 1
            raise
        finally:
            # Cleanup
            storage.close()
            self._current_storage = None

            # Clear checkpoint on successful completion
            if (
                checkpoint_manager
                and not self._shutdown_requested
                and stats.errors == 0
            ):
                checkpoint_manager.clear()

        # Log final stats
        logger.info(f"Download complete: {stats.to_dict()}")
        logger.info(f"Total messages: {stats.messages_downloaded}")
        logger.info(f"Output file: {output_path}")

        return stats

    def download_multiple(
        self,
        stream_configs: list[StreamConfig],
        continue_on_error: bool = True,
    ) -> dict[str, DownloadStats]:
        """
        Download chat from multiple streams.

        Args:
            stream_configs: List of stream configurations
            continue_on_error: Continue with next stream if one fails

        Returns:
            Dictionary mapping video IDs to their download stats
        """
        results: dict[str, DownloadStats] = {}

        for i, stream_config in enumerate(stream_configs, 1):
            logger.info(
                f"Processing stream {i}/{len(stream_configs)}: {stream_config.video_id}"
            )

            try:
                stats = self.download(stream_config)
                results[stream_config.video_id] = stats
            except Exception as e:
                logger.error(
                    f"Failed to download {stream_config.video_id}: {e}"
                )
                if not continue_on_error:
                    raise

            if self._shutdown_requested:
                break

        return results


def download_stream(
    url: str,
    output_dir: str | Path | None = None,
    output_format: str = "jsonl",
    **config_overrides: Any,
) -> DownloadStats:
    """
    Convenience function to download chat from a single stream.

    Args:
        url: YouTube video/stream URL
        output_dir: Output directory (optional)
        output_format: Output format ('jsonl', 'json', 'csv')
        **config_overrides: Additional config options

    Returns:
        DownloadStats with download summary
    """
    config_params = {"output_format": output_format}
    if output_dir:
        config_params["output_dir"] = Path(output_dir)
    config_params.update(config_overrides)

    config = DownloaderConfig(**config_params)
    stream_config = StreamConfig(url=url)
    downloader = StreamChatDownloader(config)

    return downloader.download(stream_config)
