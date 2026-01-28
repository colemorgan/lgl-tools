"""
Storage module for efficient chat message persistence.

Designed for high-volume streams with:
- Buffered writes to reduce I/O overhead
- JSONL format for streaming appends
- Checkpoint support for resuming interrupted downloads
- Memory-efficient processing
"""

import csv
import json
import logging
import time
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any

logger = logging.getLogger(__name__)


class ChatMessage:
    """
    Normalized chat message structure.

    Converts various chat-downloader message formats to a consistent structure.
    """

    __slots__ = (
        "message_id",
        "timestamp",
        "time_in_seconds",
        "author_name",
        "author_channel_id",
        "message_text",
        "message_type",
        "amount",
        "currency",
        "is_verified",
        "is_moderator",
        "is_member",
        "badges",
        "raw_data",
    )

    def __init__(self, raw_message: dict[str, Any]):
        """
        Initialize from raw chat-downloader message.

        Args:
            raw_message: Raw message dict from chat-downloader
        """
        self.message_id = raw_message.get("message_id", "")
        self.timestamp = raw_message.get("timestamp")
        self.time_in_seconds = raw_message.get("time_in_seconds", 0)
        self.author_name = raw_message.get("author", {}).get("name", "")
        self.author_channel_id = raw_message.get("author", {}).get("id", "")
        self.message_text = raw_message.get("message", "")
        self.message_type = raw_message.get("message_type", "text_message")
        self.amount = raw_message.get("money", {}).get("amount")
        self.currency = raw_message.get("money", {}).get("currency")
        self.is_verified = raw_message.get("author", {}).get("is_verified", False)
        self.is_moderator = raw_message.get("author", {}).get("is_moderator", False)
        self.is_member = raw_message.get("author", {}).get("is_member", False)
        self.badges = raw_message.get("author", {}).get("badges", [])
        self.raw_data = raw_message

    def to_dict(self, include_raw: bool = False) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = {
            "message_id": self.message_id,
            "timestamp": self.timestamp,
            "time_in_seconds": self.time_in_seconds,
            "author_name": self.author_name,
            "author_channel_id": self.author_channel_id,
            "message_text": self.message_text,
            "message_type": self.message_type,
            "amount": self.amount,
            "currency": self.currency,
            "is_verified": self.is_verified,
            "is_moderator": self.is_moderator,
            "is_member": self.is_member,
            "badges": self.badges,
        }
        if include_raw:
            data["raw_data"] = self.raw_data
        return data


class StorageBackend(ABC):
    """Abstract base class for chat storage backends."""

    @abstractmethod
    def write(self, message: ChatMessage) -> None:
        """Write a single message."""
        pass

    @abstractmethod
    def write_batch(self, messages: list[ChatMessage]) -> None:
        """Write a batch of messages."""
        pass

    @abstractmethod
    def flush(self) -> None:
        """Flush any buffered data to disk."""
        pass

    @abstractmethod
    def close(self) -> None:
        """Close the storage backend."""
        pass

    @abstractmethod
    def get_message_count(self) -> int:
        """Get total number of messages written."""
        pass


class JSONLStorage(StorageBackend):
    """
    JSONL (JSON Lines) storage backend.

    Recommended for high-volume streams:
    - Append-only format (no need to rewrite entire file)
    - Each line is a complete JSON object
    - Easy to process with streaming tools
    - Supports concurrent reads while writing
    """

    def __init__(
        self,
        output_path: Path,
        buffer_size: int = 100,
        flush_interval: float = 5.0,
        include_raw: bool = False,
    ):
        """
        Initialize JSONL storage.

        Args:
            output_path: Path to output file
            buffer_size: Number of messages to buffer before writing
            flush_interval: Force flush after this many seconds
            include_raw: Include raw message data in output
        """
        self.output_path = output_path
        self.buffer_size = buffer_size
        self.flush_interval = flush_interval
        self.include_raw = include_raw

        self._buffer: list[ChatMessage] = []
        self._lock = Lock()
        self._last_flush = time.time()
        self._message_count = 0
        self._file = None

        # Ensure parent directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Open file in append mode
        self._file = open(output_path, "a", encoding="utf-8")
        logger.info(f"Opened JSONL storage: {output_path}")

    def write(self, message: ChatMessage) -> None:
        """Write a single message to buffer."""
        with self._lock:
            self._buffer.append(message)
            if len(self._buffer) >= self.buffer_size:
                self._flush_buffer()
            elif time.time() - self._last_flush > self.flush_interval:
                self._flush_buffer()

    def write_batch(self, messages: list[ChatMessage]) -> None:
        """Write a batch of messages."""
        with self._lock:
            self._buffer.extend(messages)
            if len(self._buffer) >= self.buffer_size:
                self._flush_buffer()

    def _flush_buffer(self) -> None:
        """Internal method to flush buffer to disk."""
        if not self._buffer:
            return

        for message in self._buffer:
            line = json.dumps(message.to_dict(self.include_raw), ensure_ascii=False)
            self._file.write(line + "\n")
            self._message_count += 1

        self._file.flush()
        self._buffer.clear()
        self._last_flush = time.time()
        logger.debug(f"Flushed buffer, total messages: {self._message_count}")

    def flush(self) -> None:
        """Flush any buffered data to disk."""
        with self._lock:
            self._flush_buffer()

    def close(self) -> None:
        """Close the storage backend."""
        self.flush()
        if self._file:
            self._file.close()
            self._file = None
        logger.info(f"Closed JSONL storage, total messages: {self._message_count}")

    def get_message_count(self) -> int:
        """Get total number of messages written."""
        return self._message_count


class JSONStorage(StorageBackend):
    """
    JSON array storage backend.

    Note: Not recommended for very high-volume streams as it requires
    loading the entire file to append. Use JSONL instead.
    """

    def __init__(self, output_path: Path, include_raw: bool = False):
        self.output_path = output_path
        self.include_raw = include_raw
        self._messages: list[dict] = []
        self._lock = Lock()

        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Load existing data if file exists
        if output_path.exists():
            with open(output_path, "r", encoding="utf-8") as f:
                self._messages = json.load(f)
            logger.info(f"Loaded {len(self._messages)} existing messages from {output_path}")

    def write(self, message: ChatMessage) -> None:
        with self._lock:
            self._messages.append(message.to_dict(self.include_raw))

    def write_batch(self, messages: list[ChatMessage]) -> None:
        with self._lock:
            self._messages.extend(m.to_dict(self.include_raw) for m in messages)

    def flush(self) -> None:
        with self._lock:
            with open(self.output_path, "w", encoding="utf-8") as f:
                json.dump(self._messages, f, ensure_ascii=False, indent=2)
            logger.debug(f"Wrote {len(self._messages)} messages to {self.output_path}")

    def close(self) -> None:
        self.flush()
        logger.info(f"Closed JSON storage, total messages: {len(self._messages)}")

    def get_message_count(self) -> int:
        return len(self._messages)


class CSVStorage(StorageBackend):
    """CSV storage backend for spreadsheet compatibility."""

    FIELDNAMES = [
        "message_id",
        "timestamp",
        "time_in_seconds",
        "author_name",
        "author_channel_id",
        "message_text",
        "message_type",
        "amount",
        "currency",
        "is_verified",
        "is_moderator",
        "is_member",
    ]

    def __init__(
        self,
        output_path: Path,
        buffer_size: int = 100,
        flush_interval: float = 5.0,
    ):
        self.output_path = output_path
        self.buffer_size = buffer_size
        self.flush_interval = flush_interval

        self._buffer: list[ChatMessage] = []
        self._lock = Lock()
        self._last_flush = time.time()
        self._message_count = 0

        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Check if file exists (to determine if we need headers)
        write_header = not output_path.exists() or output_path.stat().st_size == 0

        self._file = open(output_path, "a", newline="", encoding="utf-8")
        self._writer = csv.DictWriter(
            self._file, fieldnames=self.FIELDNAMES, extrasaction="ignore"
        )

        if write_header:
            self._writer.writeheader()
            self._file.flush()

        logger.info(f"Opened CSV storage: {output_path}")

    def write(self, message: ChatMessage) -> None:
        with self._lock:
            self._buffer.append(message)
            if len(self._buffer) >= self.buffer_size:
                self._flush_buffer()
            elif time.time() - self._last_flush > self.flush_interval:
                self._flush_buffer()

    def write_batch(self, messages: list[ChatMessage]) -> None:
        with self._lock:
            self._buffer.extend(messages)
            if len(self._buffer) >= self.buffer_size:
                self._flush_buffer()

    def _flush_buffer(self) -> None:
        if not self._buffer:
            return

        for message in self._buffer:
            self._writer.writerow(message.to_dict())
            self._message_count += 1

        self._file.flush()
        self._buffer.clear()
        self._last_flush = time.time()

    def flush(self) -> None:
        with self._lock:
            self._flush_buffer()

    def close(self) -> None:
        self.flush()
        if self._file:
            self._file.close()
            self._file = None
        logger.info(f"Closed CSV storage, total messages: {self._message_count}")

    def get_message_count(self) -> int:
        return self._message_count


class CheckpointManager:
    """
    Manages download checkpoints for resume support.

    Saves state periodically so downloads can be resumed after interruption.
    """

    def __init__(self, checkpoint_dir: Path, video_id: str):
        self.checkpoint_dir = checkpoint_dir
        self.video_id = video_id
        self.checkpoint_file = checkpoint_dir / f"{video_id}.checkpoint.json"

        checkpoint_dir.mkdir(parents=True, exist_ok=True)

    def save(
        self,
        last_message_id: str,
        last_timestamp: int | None,
        message_count: int,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Save a checkpoint."""
        checkpoint_data = {
            "video_id": self.video_id,
            "last_message_id": last_message_id,
            "last_timestamp": last_timestamp,
            "message_count": message_count,
            "saved_at": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
        }

        # Atomic write
        temp_file = self.checkpoint_file.with_suffix(".tmp")
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(checkpoint_data, f, indent=2)
        temp_file.replace(self.checkpoint_file)

        logger.debug(f"Saved checkpoint at message {message_count}")

    def load(self) -> dict[str, Any] | None:
        """Load existing checkpoint if available."""
        if not self.checkpoint_file.exists():
            return None

        try:
            with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            logger.warning(f"Failed to load checkpoint: {e}")
            return None

    def clear(self) -> None:
        """Remove checkpoint file."""
        if self.checkpoint_file.exists():
            self.checkpoint_file.unlink()
            logger.debug("Cleared checkpoint")


def create_storage(
    output_format: str,
    output_path: Path,
    buffer_size: int = 100,
    flush_interval: float = 5.0,
    include_raw: bool = False,
) -> StorageBackend:
    """
    Factory function to create appropriate storage backend.

    Args:
        output_format: One of 'jsonl', 'json', 'csv'
        output_path: Path to output file
        buffer_size: Messages to buffer before writing
        flush_interval: Seconds between forced flushes
        include_raw: Include raw message data (JSONL/JSON only)

    Returns:
        Configured StorageBackend instance
    """
    format_lower = output_format.lower()

    if format_lower == "jsonl":
        return JSONLStorage(output_path, buffer_size, flush_interval, include_raw)
    elif format_lower == "json":
        return JSONStorage(output_path, include_raw)
    elif format_lower == "csv":
        return CSVStorage(output_path, buffer_size, flush_interval)
    else:
        raise ValueError(f"Unsupported output format: {output_format}")
