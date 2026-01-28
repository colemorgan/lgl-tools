"""
Command-line interface for LGL Stream Chat Downloader.

Provides a user-friendly CLI for downloading YouTube live stream chat.
"""

import sys
from pathlib import Path
from typing import Any

import click

from lgl_chat_downloader import __version__
from lgl_chat_downloader.config import DownloaderConfig, StreamConfig
from lgl_chat_downloader.downloader import StreamChatDownloader


def print_banner() -> None:
    """Print the tool banner."""
    click.echo(
        click.style(
            """
    ╔═══════════════════════════════════════════════════╗
    ║     LGL Stream Chat Downloader v{version:<17}║
    ║     YouTube Live Stream Chat Download Tool        ║
    ╚═══════════════════════════════════════════════════╝
    """.format(
                version=__version__
            ),
            fg="cyan",
        )
    )


@click.group()
@click.version_option(version=__version__, prog_name="lgl-chat-download")
def main() -> None:
    """
    LGL Stream Chat Downloader - Download YouTube live stream chat.

    Supports both currently live streams and past (VOD) live streams.
    Designed for high-volume streams with rate limit handling.

    \b
    Examples:
      # Download chat from a live or past stream
      lgl-chat-download single https://youtube.com/watch?v=VIDEO_ID

      # Download with custom output directory
      lgl-chat-download single URL --output-dir /path/to/output

      # Download multiple streams from a file
      lgl-chat-download batch urls.txt
    """
    pass


@main.command()
@click.argument("url")
@click.option(
    "-o",
    "--output-dir",
    type=click.Path(path_type=Path),
    default=None,
    help="Output directory for chat files (default: ./output)",
)
@click.option(
    "-f",
    "--format",
    "output_format",
    type=click.Choice(["jsonl", "json", "csv"], case_sensitive=False),
    default="jsonl",
    help="Output format (default: jsonl - recommended for high volume)",
)
@click.option(
    "--filename",
    type=str,
    default=None,
    help="Custom output filename (without extension)",
)
@click.option(
    "--start-time",
    type=str,
    default=None,
    help="Start time for VOD chat (format: HH:MM:SS or seconds)",
)
@click.option(
    "--end-time",
    type=str,
    default=None,
    help="End time for VOD chat (format: HH:MM:SS or seconds)",
)
@click.option(
    "--buffer-size",
    type=int,
    default=100,
    help="Messages to buffer before writing (default: 100)",
)
@click.option(
    "--request-delay",
    type=int,
    default=100,
    help="Delay between requests in ms (default: 100)",
)
@click.option(
    "--no-resume",
    is_flag=True,
    default=False,
    help="Disable resume support (start fresh)",
)
@click.option(
    "--include-raw",
    is_flag=True,
    default=False,
    help="Include raw message data in output",
)
@click.option(
    "-v",
    "--verbose",
    is_flag=True,
    default=False,
    help="Enable verbose logging",
)
@click.option(
    "-q",
    "--quiet",
    is_flag=True,
    default=False,
    help="Minimal output (errors only)",
)
def single(
    url: str,
    output_dir: Path | None,
    output_format: str,
    filename: str | None,
    start_time: str | None,
    end_time: str | None,
    buffer_size: int,
    request_delay: int,
    no_resume: bool,
    include_raw: bool,
    verbose: bool,
    quiet: bool,
) -> None:
    """
    Download chat from a single YouTube stream.

    URL can be a full YouTube URL or just a video ID.

    \b
    Supports:
      - Currently live streams
      - Past live streams (VODs with chat replay)
      - Premieres

    \b
    Examples:
      lgl-chat-download single https://youtube.com/watch?v=dQw4w9WgXcQ
      lgl-chat-download single dQw4w9WgXcQ -o ./chats -f csv
      lgl-chat-download single URL --start-time 00:30:00 --end-time 01:00:00
    """
    if not quiet:
        print_banner()

    # Build config
    config_params: dict[str, Any] = {
        "output_format": output_format,
        "write_buffer_size": buffer_size,
        "request_delay_ms": request_delay,
        "enable_resume": not no_resume,
    }

    if output_dir:
        config_params["output_dir"] = output_dir

    if verbose:
        config_params["log_level"] = "DEBUG"
    elif quiet:
        config_params["log_level"] = "ERROR"

    try:
        config = DownloaderConfig(**config_params)
        stream_config = StreamConfig(
            url=url,
            output_filename=filename,
            start_time=start_time,
            end_time=end_time,
        )

        downloader = StreamChatDownloader(config)

        if not quiet:
            click.echo(f"Downloading chat from: {click.style(url, fg='yellow')}")
            click.echo(f"Output format: {click.style(output_format, fg='green')}")
            click.echo()

        stats = downloader.download(stream_config)

        if not quiet:
            click.echo()
            click.echo(click.style("Download complete!", fg="green", bold=True))
            click.echo(f"Messages downloaded: {stats.messages_downloaded:,}")
            click.echo(f"Average speed: {stats.messages_per_second:.1f} msgs/sec")
            click.echo(
                f"Output: {config.output_dir / (filename or stream_config.video_id)}.{output_format}"
            )

    except Exception as e:
        click.echo(click.style(f"Error: {e}", fg="red"), err=True)
        sys.exit(1)


@main.command()
@click.argument("file", type=click.Path(exists=True, path_type=Path))
@click.option(
    "-o",
    "--output-dir",
    type=click.Path(path_type=Path),
    default=None,
    help="Output directory for chat files",
)
@click.option(
    "-f",
    "--format",
    "output_format",
    type=click.Choice(["jsonl", "json", "csv"], case_sensitive=False),
    default="jsonl",
    help="Output format (default: jsonl)",
)
@click.option(
    "--continue-on-error",
    is_flag=True,
    default=True,
    help="Continue with next URL if one fails (default: true)",
)
@click.option(
    "--delay-between",
    type=int,
    default=5000,
    help="Delay between streams in ms (default: 5000)",
)
@click.option(
    "-v",
    "--verbose",
    is_flag=True,
    default=False,
    help="Enable verbose logging",
)
def batch(
    file: Path,
    output_dir: Path | None,
    output_format: str,
    continue_on_error: bool,
    delay_between: int,
    verbose: bool,
) -> None:
    """
    Download chat from multiple streams listed in a file.

    FILE should contain one YouTube URL or video ID per line.
    Lines starting with # are treated as comments.

    \b
    Example urls.txt:
      # My favorite streams
      https://youtube.com/watch?v=abc123
      https://youtube.com/watch?v=def456
      xyz789

    \b
    Usage:
      lgl-chat-download batch urls.txt -o ./output
    """
    print_banner()

    # Read URLs from file
    urls: list[str] = []
    with open(file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                urls.append(line)

    if not urls:
        click.echo(click.style("No URLs found in file", fg="red"), err=True)
        sys.exit(1)

    click.echo(f"Found {click.style(str(len(urls)), fg='yellow')} URLs to process")
    click.echo()

    # Build config
    config_params: dict[str, Any] = {
        "output_format": output_format,
    }

    if output_dir:
        config_params["output_dir"] = output_dir

    if verbose:
        config_params["log_level"] = "DEBUG"

    try:
        config = DownloaderConfig(**config_params)
        stream_configs = [StreamConfig(url=url) for url in urls]

        downloader = StreamChatDownloader(config)
        results = downloader.download_multiple(
            stream_configs,
            continue_on_error=continue_on_error,
        )

        # Summary
        click.echo()
        click.echo(click.style("Batch download complete!", fg="green", bold=True))
        click.echo()

        total_messages = 0
        for video_id, stats in results.items():
            status = (
                click.style("OK", fg="green")
                if stats.errors == 0
                else click.style("ERRORS", fg="red")
            )
            click.echo(f"  {video_id}: {stats.messages_downloaded:,} messages [{status}]")
            total_messages += stats.messages_downloaded

        click.echo()
        click.echo(f"Total messages: {total_messages:,}")

    except Exception as e:
        click.echo(click.style(f"Error: {e}", fg="red"), err=True)
        sys.exit(1)


@main.command()
@click.option(
    "--output-dir",
    type=click.Path(path_type=Path),
    default=Path("./output"),
    help="Directory to check for incomplete downloads",
)
def resume(output_dir: Path) -> None:
    """
    Resume all incomplete downloads in the output directory.

    Finds all checkpoint files and attempts to resume interrupted downloads.
    """
    print_banner()

    checkpoint_dir = output_dir / ".checkpoints"
    if not checkpoint_dir.exists():
        click.echo("No checkpoints found. Nothing to resume.")
        return

    checkpoint_files = list(checkpoint_dir.glob("*.checkpoint.json"))
    if not checkpoint_files:
        click.echo("No incomplete downloads found.")
        return

    click.echo(f"Found {len(checkpoint_files)} incomplete download(s)")

    import json

    for cp_file in checkpoint_files:
        try:
            with open(cp_file, "r") as f:
                checkpoint = json.load(f)

            video_id = checkpoint.get("video_id", "unknown")
            message_count = checkpoint.get("message_count", 0)

            click.echo(f"\nResuming {video_id} from message {message_count:,}...")

            config = DownloaderConfig(output_dir=output_dir)
            stream_config = StreamConfig(url=video_id)
            downloader = StreamChatDownloader(config)

            stats = downloader.download(stream_config)

            click.echo(
                f"Completed! Total messages: {stats.messages_downloaded:,}"
            )

        except Exception as e:
            click.echo(click.style(f"Failed to resume {cp_file.stem}: {e}", fg="red"))


@main.command()
def config() -> None:
    """Show current configuration and defaults."""
    print_banner()

    click.echo("Configuration options (can be set via environment variables):")
    click.echo()

    config = DownloaderConfig()

    settings = [
        ("LGL_CHAT_OUTPUT_DIR", str(config.output_dir), "Output directory"),
        ("LGL_CHAT_OUTPUT_FORMAT", config.output_format, "Output format"),
        ("LGL_CHAT_REQUEST_DELAY_MS", str(config.request_delay_ms), "Request delay (ms)"),
        ("LGL_CHAT_MAX_RETRIES", str(config.max_retries), "Max retries on failure"),
        ("LGL_CHAT_WRITE_BUFFER_SIZE", str(config.write_buffer_size), "Write buffer size"),
        ("LGL_CHAT_FLUSH_INTERVAL_SECONDS", str(config.flush_interval_seconds), "Flush interval (s)"),
        ("LGL_CHAT_LOG_LEVEL", config.log_level, "Log level"),
        ("LGL_CHAT_ENABLE_RESUME", str(config.enable_resume), "Resume support"),
        ("LGL_CHAT_CHECKPOINT_INTERVAL", str(config.checkpoint_interval), "Checkpoint interval"),
    ]

    for env_var, default, description in settings:
        click.echo(
            f"  {click.style(env_var, fg='cyan')}: {default}"
        )
        click.echo(f"    {description}")
        click.echo()


if __name__ == "__main__":
    main()
