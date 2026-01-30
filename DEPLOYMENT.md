# Deployment Guide

This guide covers all deployment options for the Taboola Realtime Sync Dashboard.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Static Hosting (via Docker Build)](#static-hosting-via-docker-build)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)
- [Alternative: Native Node.js Setup](#alternative-native-nodejs-setup)

---

## Prerequisites

- **Docker**: v20 or higher - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: Included with Docker Desktop
- **Backend API**: Running and accessible

> **Note**: Node.js is not required when using Docker. For non-Docker deployment, see [Alternative: Native Node.js Setup](#alternative-native-nodejs-setup).

---

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:3000` | Yes |

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
VITE_API_BASE_URL=https://your-backend-api.com
```

---

## Local Development

Start the development server with hot reload:

```bash
docker compose --profile dev up frontend-dev
```

The app runs at `http://localhost:5173`

### With Custom API URL

```bash
VITE_API_BASE_URL=https://api.example.com docker compose --profile dev up frontend-dev
```

### Development Commands

| Command | Description |
|---------|-------------|
| `docker compose --profile dev up frontend-dev` | Start dev server |
| `docker compose --profile dev up frontend-dev -d` | Start in background |
| `docker compose logs -f frontend-dev` | View dev logs |
| `docker compose down` | Stop all containers |

---

## Docker Deployment

### Quick Start

```bash
# Build and run with default settings
docker compose up -d

# The app runs at http://localhost:8080
```

### Custom Configuration

```bash
# Build with custom API URL
VITE_API_BASE_URL=https://api.production.com docker compose up -d --build

# Run on different port
PORT=3000 docker compose up -d
```

### Manual Docker Commands

```bash
# Build the image
docker build \
  --build-arg VITE_API_BASE_URL=https://api.production.com \
  -t taboola-dashboard:latest .

# Run the container
docker run -d \
  --name taboola-dashboard \
  -p 8080:80 \
  --restart unless-stopped \
  taboola-dashboard:latest

# View logs
docker logs -f taboola-dashboard

# Stop and remove
docker stop taboola-dashboard && docker rm taboola-dashboard
```

### Health Check

The container exposes a health endpoint:

```bash
curl http://localhost:8080/health
# Returns: OK
```

---

## Static Hosting (via Docker Build)

Extract the production build from Docker for static hosting:

### Build and Extract

```bash
# Build the production image
docker compose build

# Extract dist files from the container
docker create --name temp-extract taboola-dashboard:latest
docker cp temp-extract:/usr/share/nginx/html ./dist
docker rm temp-extract
```

Or build with a custom API URL:

```bash
VITE_API_BASE_URL=https://api.production.com docker compose build
```

### Deploy to AWS S3 + CloudFront

```bash
# Extract build files (see above), then:
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache (optional)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Deploy to Vercel

```bash
# Extract build files (see above), then:
npx vercel --prod ./dist
```

### Deploy to Netlify

```bash
# Extract build files (see above), then:
npx netlify deploy --prod --dir=dist
```

### Deploy to Remote Server with Docker

The recommended approach for remote servers is to run the Docker container directly:

```bash
# On your remote server
docker pull your-registry/taboola-dashboard:latest
docker run -d \
  --name taboola-dashboard \
  -p 8080:80 \
  --restart unless-stopped \
  your-registry/taboola-dashboard:latest
```

Or copy the image directly:

```bash
# Save image locally
docker save taboola-dashboard:latest | gzip > dashboard.tar.gz

# Copy to server
scp dashboard.tar.gz user@server:/tmp/

# On server: load and run
docker load < /tmp/dashboard.tar.gz
docker run -d --name taboola-dashboard -p 8080:80 --restart unless-stopped taboola-dashboard:latest
```

---

## Production Checklist

### Before Deployment

- [ ] Set correct `VITE_API_BASE_URL` for production
- [ ] Verify backend API is accessible from deployment environment
- [ ] Configure CORS on backend to allow frontend domain
- [ ] Test production build locally: `docker compose up -d && curl http://localhost:8080/health`

### Security

- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Configure security headers (included in nginx.conf)
- [ ] Set up rate limiting on API endpoints
- [ ] Review and restrict CORS origins on backend

### Performance

- [ ] Enable gzip compression (included in nginx.conf)
- [ ] Configure CDN for static assets
- [ ] Set up caching headers (included in nginx.conf)

### Monitoring

- [ ] Set up health check monitoring (`/health` endpoint)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up log aggregation

---

## Troubleshooting

### CORS Errors

**Symptom**: Browser console shows CORS policy errors.

**Solution**: Configure the backend to allow requests from your frontend domain:

```javascript
// Backend CORS config example
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true
}));
```

### Connection Refused

**Symptom**: Network errors when calling API endpoints.

**Solution**:
1. Verify `VITE_API_BASE_URL` is correct
2. Ensure backend is running and accessible
3. Check firewall rules allow traffic on API port

### 404 on Page Refresh

**Symptom**: Refreshing a page other than `/` returns 404.

**Solution**: Ensure your web server is configured for SPA routing (serve `index.html` for all routes). The provided `nginx.conf` handles this.

### Docker Build Fails

**Symptom**: `npm ci` fails during Docker build.

**Solution**:
1. Ensure `package-lock.json` is committed
2. Clear Docker cache: `docker compose build --no-cache`

### Environment Variables Not Working

**Symptom**: API URL is still localhost in production.

**Solution**: Vite embeds environment variables at build time. Rebuild with correct variables:

```bash
VITE_API_BASE_URL=https://api.production.com docker compose up -d --build
```

### Hot Reload Not Working in Development

**Symptom**: Changes to source files don't trigger browser refresh.

**Solution**:
1. Ensure you're using the dev profile: `--profile dev`
2. Check Docker Desktop file sharing settings include your project directory
3. Restart the container: `docker compose down && docker compose --profile dev up frontend-dev`

### Port Already in Use

**Symptom**: Container fails to start with "port already in use" error.

**Solution**:
```bash
# Find what's using the port
lsof -i :5173  # for dev
lsof -i :8080  # for prod

# Or use a different port
PORT=3001 docker compose up -d
DEV_PORT=3000 docker compose --profile dev up frontend-dev
```

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   Browser       │────▶│   Nginx         │
│                 │     │   (Port 80)     │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │  Static Files   │
                        │  (React SPA)    │
                        │                 │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │  Backend API    │
                        │  (Port 3000)    │
                        │                 │
                        └─────────────────┘
```

---

## File Reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for production container |
| `docker-compose.yml` | Container orchestration for dev and prod |
| `nginx.conf` | Nginx configuration for SPA serving |
| `.dockerignore` | Files excluded from Docker build |
| `.env.example` | Environment variable template |

---

## Alternative: Native Node.js Setup

If you cannot use Docker, you can run the application directly with Node.js.

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher

### Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env to set VITE_API_BASE_URL

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`

### Production Build

```bash
# Set API URL and build
VITE_API_BASE_URL=https://api.production.com npm run build

# Preview the build locally
npm run preview
```

The built files will be in the `dist` directory, ready for deployment to any static hosting provider.

### Deploy to Nginx (Manual)

1. Build the app:
   ```bash
   npm run build
   ```

2. Copy `dist/` contents to your web server:
   ```bash
   scp -r dist/* user@server:/var/www/html/
   ```

3. Configure Nginx (use provided `nginx.conf` as reference):
   ```nginx
   server {
       listen 80;
       root /var/www/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
