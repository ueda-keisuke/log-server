# Simple Log Collector

A lightweight log collection system designed for local development environments. Collects and organizes logs by thread/request ID, making it easy to trace and debug application behavior.

## Features

- Thread-based log organization
- Simple REST API for log collection
- SQLite storage for easy setup
- No external dependencies required
- Docker support

## Use Cases

- Collecting logs from local development servers
- Tracing request flows across microservices
- Debugging complex workflows
- Team-wide log aggregation during development

## Quick Start

```bash
# Start the log collector
npm start

# Send a log
curl -X POST http://localhost:3000/logs \
  -H "Content-Type: application/json" \
  -d '{
    "threadId": "request-123",
    "level": "info",
    "message": "Request processed",
    "metadata": {
      "method": "GET",
      "path": "/api/users",
      "duration": 45
    }
  }'