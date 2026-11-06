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

# executa app sem privilegio (DS-0002)
RUN groupadd -g 10001 app && useradd -u 10001 -m -g app -s /bin/sh app
USER app
