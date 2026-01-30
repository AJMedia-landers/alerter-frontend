# Quick Start Guide

## Prerequisites

- **Docker** (v20 or higher) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (included with Docker Desktop)
- Backend server running on `http://localhost:3000` (or configure different URL)

## Installation & Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Start development server** (with hot reload):
   ```bash
   docker compose --profile dev up frontend-dev
   ```

3. **Open browser**:
   Navigate to `http://localhost:5173`

### Custom Backend URL

If your backend is running on a different URL:

```bash
VITE_API_BASE_URL=https://api.example.com docker compose --profile dev up frontend-dev
```

### Running in Production Mode

```bash
# Build and start production container
docker compose up -d

# Access at http://localhost:8080
```

## Using the Dashboard

The dashboard provides realtime monitoring and analysis of campaign performance:

1. **Realtime Reports (Threshold)**
   - Syncs ads reports for the last X hours
   - Useful for: Quick performance checks
   - Parameter: Hours (1-24, default: 3)

2. **Realtime Reports (Comparison)**
   - Compares current X hours vs previous X hours
   - Useful for: Period-over-period analysis
   - Parameter: Hours (1-24, default: 3)
   - Example: 3 hours compares last 3 hours vs 3-6 hours ago

3. **Realtime vs Historical**
   - Compares realtime performance vs historical averages
   - Useful for: Long-term trend analysis
   - Parameters:
     - Hours (1-24, default: 3): Realtime window
     - Days (1-30, default: 7): Historical baseline

## Response Details

After triggering a sync, the response card shows:

- **Status**: Success/Failed indicator
- **Sync Status**: Success, partial_failure, or failure
- **Message**: Summary of the operation
- **Response Data**: Detailed sync results (click to expand)
- **Errors**: Any errors encountered (if applicable)

## Tips

- **Monitor execution time**: Each response shows total execution time
- **Check errors**: Expand "Errors" section if sync status shows partial_failure
- **Review data**: Click "Response Data" to see detailed sync statistics
- **Adjust parameters**: Increase hours/days for broader analysis, decrease for faster syncs

## Production Build

To build and run for production:

```bash
# Build the production container
docker compose build

# Run the production container
docker compose up -d
```

The app will be available at `http://localhost:8080`.

To build with a custom API URL:

```bash
VITE_API_BASE_URL=https://api.production.com docker compose up -d --build
```

## Docker Commands Reference

| Command | Description |
|---------|-------------|
| `docker compose --profile dev up frontend-dev` | Start dev server with hot reload |
| `docker compose up -d` | Run production container (detached) |
| `docker compose down` | Stop and remove containers |
| `docker compose logs -f` | View container logs |
| `docker compose ps` | List running containers |

## Troubleshooting

### Docker Container Won't Start
- Run `docker compose logs` to see error messages
- Ensure Docker daemon is running
- Check port 5173 (dev) or 8080 (prod) isn't in use

### CORS Errors
- Ensure backend has CORS enabled (it should by default)
- Check that `VITE_API_BASE_URL` points to correct backend

### Connection Refused
- Verify backend server is running
- Check backend is listening on the correct port (3000)
- If backend is also in Docker, ensure network connectivity

### 404 Not Found
- Ensure all cron routes are registered in backend
- Check `/api/cron/` prefix is correct

### Sync Takes Too Long
- Reduce the hours/days parameters
- Check backend logs for performance issues

### Hot Reload Not Working
- Ensure you're using the dev profile: `--profile dev`
- Check that volume mounts are working (Docker Desktop settings)
- Try restarting: `docker compose down && docker compose --profile dev up frontend-dev`
