# LGL Stream Chat Downloader

A high-performance YouTube live stream chat downloader designed to handle extremely high-volume streams without hitting rate limits. Supports both currently live streams and past (VOD) live streams.

## Features

- **High Volume Support**: Designed for streams with thousands of messages per minute
- **Rate Limit Handling**: Automatic exponential backoff to avoid hitting YouTube limits
- **Live & VOD Support**: Works with currently live streams and past broadcasts
- **Memory Efficient**: Streaming writes to disk, minimal memory footprint
- **Resume Support**: Checkpoint system to resume interrupted downloads
- **Multiple Output Formats**: JSONL (recommended), JSON, or CSV
- **Flexible Deployment**: Run locally, in Docker, or on Railway

## Installation

### Local Installation

```bash
# Clone the repository
git clone https://github.com/colemorgan/lgl-tools.git
cd lgl-tools/standalone-tools/stream-chat-downloader

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install the package
pip install -e .
```

### Docker Installation

```bash
# Build the image
docker build -t lgl-chat-downloader .

# Run a download
docker run --rm -v $(pwd)/output:/app/output lgl-chat-downloader single <URL>
```

## Quick Start

### Download chat from a single stream

```bash
# Using video URL
lgl-chat-download single https://www.youtube.com/watch?v=VIDEO_ID

# Using just video ID
lgl-chat-download single VIDEO_ID

# With custom output directory
lgl-chat-download single URL -o ./my-chats

# Export as CSV instead of JSONL
lgl-chat-download single URL -f csv
```

### Download chat from a VOD with time range

```bash
# Download only a specific portion
lgl-chat-download single URL --start-time 00:30:00 --end-time 01:00:00

# Start from 1 hour mark
lgl-chat-download single URL --start-time 3600
```

### Batch download multiple streams

Create a file with URLs (one per line):

```text
# streams.txt
https://www.youtube.com/watch?v=abc123
https://www.youtube.com/watch?v=def456
xyz789
```

Then run:

```bash
lgl-chat-download batch streams.txt -o ./output
```

### Resume interrupted downloads

```bash
# Resume all incomplete downloads
lgl-chat-download resume --output-dir ./output
```

## Configuration

Configuration can be set via environment variables or a `.env` file:

```bash
# Copy the example config
cp .env.example .env

# Edit as needed
nano .env
```

### Key Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `LGL_CHAT_OUTPUT_DIR` | `./output` | Output directory |
| `LGL_CHAT_OUTPUT_FORMAT` | `jsonl` | Output format (jsonl, json, csv) |
| `LGL_CHAT_REQUEST_DELAY_MS` | `100` | Delay between requests (increase for rate limits) |
| `LGL_CHAT_WRITE_BUFFER_SIZE` | `100` | Messages to buffer before writing |
| `LGL_CHAT_ENABLE_RESUME` | `true` | Enable checkpoint/resume support |
| `LGL_CHAT_LOG_LEVEL` | `INFO` | Logging level |

View all configuration options:

```bash
lgl-chat-download config
```

## Output Format

### JSONL (Recommended for high volume)

Each line is a complete JSON object, making it easy to stream-process:

```json
{"message_id": "abc123", "timestamp": 1234567890, "author_name": "User", "message_text": "Hello!"}
{"message_id": "def456", "timestamp": 1234567891, "author_name": "Other", "message_text": "Hi!"}
```

Process with standard tools:

```bash
# Count messages
wc -l output/video.jsonl

# Filter Super Chats
grep '"message_type":"paid_message"' output/video.jsonl

# Convert to other formats with jq
cat output/video.jsonl | jq -s '.'
```

### JSON

Standard JSON array format:

```json
[
  {"message_id": "abc123", "author_name": "User", "message_text": "Hello!"},
  {"message_id": "def456", "author_name": "Other", "message_text": "Hi!"}
]
```

### CSV

Spreadsheet-compatible format with headers.

## Deployment on Railway

This tool is designed to run as a long-running worker on Railway:

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Railway will automatically detect the `Dockerfile`
4. Set environment variables in Railway dashboard
5. Deploy!

### Running as a one-off job

```bash
# In Railway, run a one-off command
lgl-chat-download single https://youtube.com/watch?v=VIDEO_ID
```

### Running as a continuous service

Set up batch processing with a URL file mounted via Railway volumes.

## Docker Compose

For local development with Docker Compose:

```bash
# Build and run interactive download
docker-compose run --rm chat-downloader single <URL>

# Run continuous batch watcher (edit watch-urls.txt first)
docker-compose up chat-watcher
```

## Programmatic Usage

```python
from lgl_chat_downloader import StreamChatDownloader, DownloaderConfig
from lgl_chat_downloader.config import StreamConfig

# Create configuration
config = DownloaderConfig(
    output_format="jsonl",
    output_dir="./output",
    request_delay_ms=200,  # Increase for rate limiting
)

# Create stream configuration
stream = StreamConfig(
    url="https://www.youtube.com/watch?v=VIDEO_ID",
    start_time="00:30:00",  # Optional
    end_time="01:00:00",    # Optional
)

# Download
downloader = StreamChatDownloader(config)
stats = downloader.download(stream)

print(f"Downloaded {stats.messages_downloaded} messages")
```

## Handling High Volume Streams

For extremely high-volume streams (e.g., major events with 10k+ concurrent viewers):

1. **Increase buffer size** to reduce disk I/O:
   ```bash
   lgl-chat-download single URL --buffer-size 500
   ```

2. **Use JSONL format** (default) for efficient streaming writes

3. **Increase request delay** if experiencing rate limits:
   ```bash
   lgl-chat-download single URL --request-delay 200
   ```

4. **Enable resume** (default) to recover from interruptions

5. **Monitor disk space** - high volume streams can generate gigabytes of data

## Troubleshooting

### "No chat replay available"

This means the video either:
- Is not a live stream/premiere
- Has chat replay disabled
- Is too old (chat replay may be unavailable)

### Rate limiting / connection errors

Increase the request delay:

```bash
LGL_CHAT_REQUEST_DELAY_MS=500 lgl-chat-download single URL
```

### Memory issues

Reduce buffer size and ensure you're using JSONL format:

```bash
lgl-chat-download single URL --buffer-size 50 -f jsonl
```

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions welcome! Please open an issue or pull request.
