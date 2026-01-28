"""
LGL Stream Chat Downloader

A high-performance YouTube live stream chat downloader that handles
extremely high volume streams without hitting rate limits.

Supports both currently live streams and past (VOD) live streams.
"""

__version__ = "1.0.0"
__author__ = "LGL Tools"

from lgl_chat_downloader.downloader import StreamChatDownloader
from lgl_chat_downloader.config import DownloaderConfig

__all__ = ["StreamChatDownloader", "DownloaderConfig", "__version__"]
