#!/bin/sh
set -e

# Reset documentation project to pristine state at midnight
echo "0 0 * * * rm -rf /app/projects/documentation && cp -r /app/projects-pristine /app/projects/documentation" | crontab -
cron

cd /app/backend
exec .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8002
