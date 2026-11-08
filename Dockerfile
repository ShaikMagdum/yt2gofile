FROM python:3.11-slim

# Install system dependencies: ffmpeg for media merging, curl, unzip, and nodejs
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    unzip \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Deno (official primary JS challenge provider for yt-dlp)
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

WORKDIR /app

# Copy requirements & install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Default port
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
