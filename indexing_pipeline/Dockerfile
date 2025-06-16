# Prefect ETL Pipeline Dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy pyproject.toml, uv.lock, and README.md (required by pyproject.toml)
COPY pyproject.toml ./
COPY uv.lock* ./
COPY .env ./
COPY README.md ./

# Install dependencies
RUN uv sync --frozen

# Create directories for the pipeline
RUN mkdir -p /app/src/indexing_pipeline

# Copy source code (this will be overridden by volume mount in development)
COPY src/ ./src/
# Install the package in development mode
RUN uv pip install -e .

# Expose Prefect UI port
EXPOSE 4200

# Set environment variables
ENV PYTHONPATH=/app
ENV PREFECT_API_URL=http://0.0.0.0:4200/api
# Activate UV virtual environment
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="/app/.venv/bin:$PATH"

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["dev"]
