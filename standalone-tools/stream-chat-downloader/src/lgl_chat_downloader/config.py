"""
Configuration management for LGL Stream Chat Downloader.

Uses Pydantic for validation and supports environment variables.
"""

import os
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class DownloaderConfig(BaseSettings):
    """
    Configuration for the chat downloader.

    All settings can be overridden via environment variables with the
    LGL_CHAT_ prefix. For example: LGL_CHAT_OUTPUT_DIR=/data/chats
    """

    model_config = SettingsConfigDict(
        env_prefix="LGL_CHAT_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Output settings
    output_dir: Path = Field(
        default=Path("./output"),
        description="Directory to store downloaded chat files",
    )

    output_format: Literal["jsonl", "json", "csv"] = Field(
        default="jsonl",
        description="Output format. JSONL recommended for high volume streams",
    )

    # Rate limiting settings - critical for high volume streams
    request_delay_ms: int = Field(
        default=100,
        ge=0,
        le=5000,
        description="Delay between requests in milliseconds. Increase if hitting rate limits",
    )

    max_retries: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum retry attempts on failure",
    )

    retry_base_delay_seconds: float = Field(
        default=2.0,
        ge=0.5,
        le=30.0,
        description="Base delay for exponential backoff retries",
    )

    # Buffer settings for memory efficiency
    write_buffer_size: int = Field(
        default=100,
        ge=1,
        le=10000,
        description="Number of messages to buffer before writing to disk",
    )

    flush_interval_seconds: float = Field(
        default=5.0,
        ge=1.0,
        le=60.0,
        description="Force flush buffer to disk at this interval",
    )

    # Logging settings
    log_dir: Path = Field(
        default=Path("./logs"),
        description="Directory for log files",
    )

    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(
        default="INFO",
        description="Logging level",
    )

    log_to_file: bool = Field(
        default=True,
        description="Whether to write logs to file in addition to console",
    )

    # Download behavior
    include_superchat: bool = Field(
        default=True,
        description="Include Super Chat and Super Sticker messages",
    )

    include_membership: bool = Field(
        default=True,
        description="Include membership messages",
    )

    timeout_seconds: int = Field(
        default=30,
        ge=5,
        le=300,
        description="HTTP request timeout in seconds",
    )

    # Resume support
    enable_resume: bool = Field(
        default=True,
        description="Enable resuming interrupted downloads",
    )

    checkpoint_interval: int = Field(
        default=1000,
        ge=100,
        le=100000,
        description="Save checkpoint every N messages for resume support",
    )

    @field_validator("output_dir", "log_dir", mode="before")
    @classmethod
    def ensure_path(cls, v: str | Path) -> Path:
        """Convert string to Path and create directory if needed."""
        path = Path(v) if isinstance(v, str) else v
        path.mkdir(parents=True, exist_ok=True)
        return path


class StreamConfig:
    """
    Configuration for a specific stream download.
    """

    def __init__(
        self,
        url: str,
        output_filename: str | None = None,
        start_time: str | None = None,
        end_time: str | None = None,
    ):
        """
        Initialize stream-specific configuration.

        Args:
            url: YouTube video/stream URL or ID
            output_filename: Custom output filename (auto-generated if not provided)
            start_time: Start time for VOD (format: HH:MM:SS or seconds)
            end_time: End time for VOD (format: HH:MM:SS or seconds)
        """
        self.url = url
        self.output_filename = output_filename
        self.start_time = start_time
        self.end_time = end_time
        self.video_id = self._extract_video_id(url)

    def _extract_video_id(self, url: str) -> str:
        """Extract video ID from various YouTube URL formats."""
        import re

        # Already a video ID
        if re.match(r"^[a-zA-Z0-9_-]{11}$", url):
            return url

        # Full URL patterns
        patterns = [
            r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/live/)([a-zA-Z0-9_-]{11})",
            r"youtube\.com/embed/([a-zA-Z0-9_-]{11})",
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)

        # Return as-is if no pattern matches (let chat-downloader handle it)
        return url


def load_config(env_file: str | None = None) -> DownloaderConfig:
    """
    Load configuration from environment and optional .env file.

    Args:
        env_file: Path to .env file (optional)

    Returns:
        Validated DownloaderConfig instance
    """
    if env_file:
        from dotenv import load_dotenv
        load_dotenv(env_file)

    return DownloaderConfig()
