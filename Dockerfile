# Stage 1: Build Vite / React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web

# Install dependencies
COPY web/package*.json ./
RUN npm ci

# Copy web source and compile production bundle
COPY web/ ./
RUN npm run build

# Stage 2: Production Python Runtime
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install backend dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY core/ ./core/
COPY server.py .

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/web/dist ./web/dist

# Default port (can be overridden by cloud providers via $PORT)
EXPOSE 8000

# Start server using $PORT if provided, defaulting to 8000
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]

