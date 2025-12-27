# 🎣 Fishing Tracker Pro - Production Deployment Guide

Complete guide for deploying Fishing Tracker Pro behind **Traefik + Cloudflare**.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Docker Compose Configuration](#docker-compose-configuration)
5. [Deployment](#deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Server Requirements
- Ubuntu 20.04+ or Debian 11+
- Minimum 2GB RAM
- 20GB disk space
- Traefik already running
- Cloudflare configured for your domain

### External Services
- Domain name with Cloudflare DNS
- Google OAuth credentials
- WeatherAPI.com account (free tier)
- (Optional) WorldTides API account

---

## 📁 Project Setup

### 1. Clone Repository

```bash
cd ~
git clone https://github.com/yourusername/fishing-tracker.git
cd fishing-tracker
```

### 2. Create Directory Structure

```bash
# Verify structure
tree -L 2
```

Should show:
```
fishing-tracker/
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Configuration

### 1. Root `.env`

```bash
nano .env
```

**Content:**
```env
# Database password (must match backend/.env)
DB_PASSWORD=YourSecureDatabasePassword123!

# Domain configuration
DOMAIN=yourdomain.com
```

### 2. Backend `.env`

```bash
nano backend/.env
```

**Content:**
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fishing_tracker
DB_USER=postgres
DB_PASSWORD=YourSecureDatabasePassword123!

# JWT Configuration
# Generate with: openssl rand -base64 32
JWT_SECRET=K8h3nP9mR2vL5sJ7wQ1xZ4tY6uF0aE3g
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# Weather API
# Get from: https://www.weatherapi.com/ (1M free calls/month)
OPENWEATHER_API_KEY=not-needed
WEATHERAPI_KEY=your-weatherapi-key-here

# Tide API (optional - uses free fallback if not provided)
WORLDTIDES_API_KEY=your-worldtides-key-or-leave-as-is

# CORS
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Session Secret
# Generate with: openssl rand -base64 32
SESSION_SECRET=M2nB7kL9pR4vX8wS3tF6yQ1zA5eH0jC2
```

### 3. Frontend `.env`

```bash
nano frontend/.env
```

**Content:**
```env
REACT_APP_API_URL=https://yourdomain.com/api
```

### 4. Generate Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate SESSION_SECRET
openssl rand -base64 32

# Copy these into backend/.env
```

---

## 🐳 Docker Compose Configuration

### Replace `docker-compose.yml`

```bash
nano docker-compose.yml
```

**Content:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: fishing-tracker-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: fishing_tracker
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - fishing-network
      - traefik-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: fishing-tracker-backend
    env_file:
      - ./backend/.env
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - fishing-network
      - traefik-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.fishing-backend.rule=Host(`${DOMAIN}`) && PathPrefix(`/api`)"
      - "traefik.http.routers.fishing-backend.entrypoints=websecure"
      - "traefik.http.routers.fishing-backend.tls=true"
      - "traefik.http.services.fishing-backend.loadbalancer.server.port=5000"
      - "traefik.docker.network=traefik-network"
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: fishing-tracker-frontend
    depends_on:
      - backend
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.fishing-frontend.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.fishing-frontend.entrypoints=websecure"
      - "traefik.http.routers.fishing-frontend.tls=true"
      - "traefik.http.services.fishing-frontend.loadbalancer.server.port=80"
      - "traefik.docker.network=traefik-network"
    restart: unless-stopped

networks:
  fishing-network:
    driver: bridge
  traefik-network:
    external: true

volumes:
  postgres_data:
```

### Update Frontend Nginx Config

Since you're behind Traefik, simplify the nginx config:

```bash
nano frontend/nginx.conf
```

**Content:**
```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

**Note:** No SSL config needed - Traefik handles that!

---

## 🚀 Deployment

### 1. Verify Traefik Network Exists

```bash
docker network ls | grep traefik
```

If not found, create it:
```bash
docker network create traefik-network
```

### 2. Build and Start Containers

```bash
# Build images
docker-compose build --no-cache

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Verify Containers are Running

```bash
docker-compose ps
```

Should show:
```
NAME                      STATUS
fishing-tracker-backend   Up
fishing-tracker-db        Up (healthy)
fishing-tracker-frontend  Up
```

### 4. Check Traefik Dashboard

Visit your Traefik dashboard and verify:
- `fishing-frontend@docker` router is active
- `fishing-backend@docker` router is active
- Both showing green/healthy status

---

## ✅ Post-Deployment Verification

### 1. Test Health Endpoints

```bash
# Test frontend health
curl https://yourdomain.com/health

# Test backend health
curl https://yourdomain.com/api/health
```

### 2. Test API Registration

```bash
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"test123"}'
```

Expected response:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@test.com"
  }
}
```

### 3. Test Google OAuth

1. Visit `https://yourdomain.com`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify you're logged in

### 4. Test Full Workflow

1. Login to application
2. Navigate to "Log Trip" tab
3. Select a location (e.g., Grand Baie)
4. Verify moon phase, tide, and weather data loads
5. Create a fishing log
6. Check "View Data" tab to see your log
7. Check "Reports" tab for charts
8. Check "Predictions" tab

---

## 🔧 Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backup Database

```bash
# Create backup
docker exec fishing-tracker-db pg_dump -U postgres fishing_tracker > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i fishing-tracker-db psql -U postgres fishing_tracker < backup_20251227_120000.sql
```

### Database Maintenance

```bash
# Access database
docker exec -it fishing-tracker-db psql -U postgres -d fishing_tracker

# View tables
\dt

# View user count
SELECT COUNT(*) FROM users;

# View log count
SELECT COUNT(*) FROM fishing_logs;

# Exit
\q
```

---

## 🐛 Troubleshooting

### Issue: Containers Won't Start

```bash
# Check container status
docker-compose ps

# View logs for errors
docker-compose logs

# Check if traefik network exists
docker network ls | grep traefik
```

### Issue: Database Connection Failed

```bash
# Check if postgres is healthy
docker-compose ps postgres

# Verify password in both .env files
cat .env | grep DB_PASSWORD
cat backend/.env | grep DB_PASSWORD

# Test database connection
docker exec fishing-tracker-db psql -U postgres -c "SELECT version();"
```

### Issue: 502 Bad Gateway

```bash
# Check backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Verify backend is on traefik network
docker inspect fishing-tracker-backend | grep -A 5 Networks
```

### Issue: Google OAuth Not Working

**Check callback URL:**
1. Google Cloud Console → Credentials
2. Verify redirect URI: `https://yourdomain.com/api/auth/google/callback`
3. Check `backend/.env` has same URL

**Check CORS settings:**
```bash
# Verify CORS_ORIGIN in backend/.env
cat backend/.env | grep CORS_ORIGIN
# Should be: CORS_ORIGIN=https://yourdomain.com
```

### Issue: Weather Data Not Loading

```bash
# Check if API key is set
docker exec fishing-tracker-backend env | grep WEATHERAPI_KEY

# Test API key manually
curl "https://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=-20.0167,57.5833"
```

### Issue: Frontend Not Loading

```bash
# Check nginx config
docker exec fishing-tracker-frontend cat /etc/nginx/conf.d/default.conf

# Check frontend logs
docker-compose logs frontend

# Verify Traefik labels
docker inspect fishing-tracker-frontend | grep -A 20 Labels
```

---

## 📊 Monitoring

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up unused images
docker system prune -a
```

### Monitor Application

```bash
# Watch logs in real-time
docker-compose logs -f --tail=50

# Check database size
docker exec fishing-tracker-db psql -U postgres -d fishing_tracker -c "
SELECT 
  pg_size_pretty(pg_database_size('fishing_tracker')) as size
"
```

---

## 🔐 Security Checklist

- [ ] All `.env` files are in `.gitignore`
- [ ] Strong database password set
- [ ] JWT_SECRET and SESSION_SECRET are random 32+ character strings
- [ ] Google OAuth restricted to your domain
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] Cloudflare proxy enabled (orange cloud)
- [ ] Database not exposed to public (no ports in docker-compose)
- [ ] Regular backups configured
- [ ] Container logs monitored

---

## 📚 Additional Resources

### API Documentation
- **Health Check:** `GET /api/health`
- **Locations:** `GET /api/fishing/locations` (requires auth)
- **Environmental Data:** `GET /api/fishing/environmental-data?date=YYYY-MM-DD&locationId=grand-baie` (requires auth)
- **Create Log:** `POST /api/fishing/logs` (requires auth)
- **Get Logs:** `GET /api/fishing/logs` (requires auth)
- **Statistics:** `GET /api/statistics` (requires auth)

### Useful Commands

```bash
# Quick restart
docker-compose restart

# View container IPs
docker inspect fishing-tracker-backend | grep IPAddress

# Follow specific log
docker-compose logs -f backend | grep ERROR

# Shell into container
docker exec -it fishing-tracker-backend sh

# Check environment variables
docker exec fishing-tracker-backend env

# Export logs
docker-compose logs > logs_$(date +%Y%m%d).txt
```

---

## 🎯 Quick Reference

### File Locations

| File | Location | Purpose |
|------|----------|---------|
| Database Password | `.env` | Shared config |
| Backend Config | `backend/.env` | API configuration |
| Frontend Config | `frontend/.env` | React app config |
| Nginx Config | `frontend/nginx.conf` | Web server config |
| Docker Compose | `docker-compose.yml` | Container orchestration |
| Database Schema | `init.sql` | Initial DB setup |

### Important URLs

| Service | URL |
|---------|-----|
| Frontend | `https://yourdomain.com` |
| API | `https://yourdomain.com/api` |
| Health Check | `https://yourdomain.com/api/health` |
| Google OAuth | `https://yourdomain.com/api/auth/google` |

### Port Mapping (Internal)

| Service | Internal Port |
|---------|--------------|
| Frontend | 80 |
| Backend | 5000 |
| PostgreSQL | 5432 |

**Note:** Ports are NOT exposed - Traefik handles all external access.

---

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review container logs: `docker-compose logs`
3. Check Traefik dashboard for routing issues
4. Verify Cloudflare DNS settings

---

**Last Updated:** December 27, 2025
**Version:** 1.0.0