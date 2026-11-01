FROM python:3.12-slim

WORKDIR /app

# Copy application files
COPY scripts/ /app/scripts/
COPY src/ /app/src/
COPY data/ /app/data/

ENV PYTHONPATH=/app

# Default entrypoint runs the CLI checker
ENTRYPOINT ["python3", "src/cli.py"]
CMD []
