# Taboola Realtime Sync Dashboard

A Next.js frontend dashboard for managing and triggering Taboola realtime sync operations.

## Features

This dashboard provides an interface to trigger three different types of realtime sync operations:

1. **Realtime Reports (Threshold)** - Sync realtime ads reports for the last X hours
2. **Realtime Reports (Comparison)** - Compare current X hours vs previous X hours performance
3. **Realtime vs Historical** - Compare realtime X hours vs Y days historical average

## Setup

### Prerequisites

- **Docker** (v20 or higher) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (included with Docker Desktop)

### Quick Start

1. Start the development server:
```bash
docker compose --profile dev up frontend-dev
```

The app will be available at `http://localhost:3001` with hot reload enabled.

2. (Optional) Configure custom backend API URL:
```bash
API_BASE_URL=https://api.example.com docker compose --profile dev up frontend-dev
```

### Production Mode

```bash
# Build and run production container
docker compose up -d

# Access at http://localhost:8080
```

With custom API URL:
```bash
API_BASE_URL=https://api.production.com docker compose up -d --build
```

## API Endpoints

The frontend connects to the following backend endpoints:

- `GET /api/cron/taboola/sync-realtime-reports-threshold?hours=3`
- `GET /api/cron/taboola/sync-realtime-reports-comparison?hours=3`
- `GET /api/cron/taboola/sync-realtime-vs-historical?hours=3&days=7`

## Usage

1. Select the sync operation you want to run
2. Configure the parameters (hours and/or days)
3. Click the sync button
4. View the response with detailed sync results, including:
   - Success/failure status
   - Number of reports synced
   - Execution time
   - Any errors encountered

## Build for Production

```bash
# Build production container
docker compose build

# Or build and run with custom API URL
API_BASE_URL=https://api.production.com docker compose up -d --build
```

## Docker Commands Reference

| Command | Description |
|---------|-------------|
| `docker compose --profile dev up frontend-dev` | Start development server with hot reload |
| `docker compose up -d` | Run production container |
| `docker compose up -d --build` | Rebuild and run production container |
| `docker compose down` | Stop and remove containers |
| `docker compose logs -f` | View container logs |

## Health Check

```bash
curl http://localhost:8080/
```

For complete deployment options and advanced configuration, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Tech Stack

- Next.js 15
- React 19
- TypeScript
