# LGL Stream Chat Downloader
# Dockerfile for containerized deployment (Railway, Docker, etc.)

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create app user for security
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid 1000 --create-home appuser

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Install the package
RUN pip install --no-cache-dir -e .

# Create output and log directories
RUN mkdir -p /app/output /app/logs && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set default environment variables
ENV LGL_CHAT_OUTPUT_DIR=/app/output \
    LGL_CHAT_LOG_DIR=/app/logs \
    LGL_CHAT_LOG_LEVEL=INFO

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "from lgl_chat_downloader import __version__; print(__version__)" || exit 1

# Default command shows help
ENTRYPOINT ["lgl-chat-download"]
CMD ["--help"]
