# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_DEMO_MODE=1
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE
RUN node node_modules/vite/bin/vite.js build

# Stage 2: Runtime
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends cron && rm -rf /var/lib/apt/lists/*

# Backend
COPY backend/ ./backend/
RUN python -m venv backend/.venv \
    && backend/.venv/bin/pip install --no-cache-dir -r backend/requirements.txt

# Built frontend
COPY --from=frontend-build /build/dist/ ./frontend/dist/

# Documentation project only
COPY projects/documentation/ ./projects/documentation/

# Pristine copy for midnight reset
RUN cp -r /app/projects/documentation /app/projects-pristine/

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8002
CMD ["/app/entrypoint.sh"]
