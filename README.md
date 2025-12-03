# Job Platform - Full Stack Application

[![CI](https://github.com/Manojchinnaiyan/joblisting/actions/workflows/ci.yml/badge.svg)](https://github.com/Manojchinnaiyan/joblisting/actions/workflows/ci.yml)
[![Deploy](https://github.com/Manojchinnaiyan/joblisting/actions/workflows/deploy.yml/badge.svg)](https://github.com/Manojchinnaiyan/joblisting/actions/workflows/deploy.yml)

A modern, scalable job listing platform with Go backend and Next.js frontend.

## Tech Stack

### Backend
- **Framework**: Gin v1.10.0
- **Database**: PostgreSQL 17
- **Cache**: Redis 7.4
- **Search**: Meilisearch v1.16
- **Storage**: MinIO (S3-compatible)
- **ORM**: GORM v1.25
- **Language**: Go 1.24

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript 5.6
- **UI**: React 19 + Tailwind CSS 3.4
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **Components**: Radix UI

## Prerequisites

- Go 1.24+
- Node.js 18+
- Docker & Docker Compose
- Make (optional, for convenience)

## Quick Start

### 1. Clone & Setup

**Backend:**
```bash
# Install Go dependencies
make install

# Or manually
go mod download
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Start Services
```bash
# Start all Docker services (PostgreSQL, Redis, Meilisearch, MinIO)
make up
```

### 3. Run Applications

**Backend (Terminal 1):**

*Option A: With Hot Reload (Recommended)*
```bash
# Install Air (hot reload tool)
go install github.com/air-verse/air@latest

# Run with hot reload
make dev
# Backend runs on http://localhost:8080
```

*Option B: Standard Go Run*
```bash
go run cmd/main.go
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3001
```

### 4. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8080/api/v1
- **Health Check**: http://localhost:8080/health

## Available Commands
```bash
make help          # Show all available commands
make install       # Install Go dependencies
make dev           # Start services + run app with hot reload
make up            # Start Docker services only
make down          # Stop all services
make restart       # Restart services
make logs          # Show service logs
make clean         # Remove all containers and volumes
make ps            # Show running containers
make run           # Run Go app without Docker
make build         # Build binary
make test          # Run tests
make db-shell      # Connect to PostgreSQL
make redis-cli     # Connect to Redis
```

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:8080 | - |
| **Health Check** | http://localhost:8080/health | - |
| **Meilisearch** | http://localhost:7700 | Key: `masterKey123` |
| **MinIO Console** | http://localhost:9001 | admin/minioadmin |
| **Adminer (DB UI)** | http://localhost:8081 | postgres/postgres |
| **PostgreSQL** | localhost:5432 | postgres/postgres |
| **Redis** | localhost:6379 | - |

## API Endpoints

### Health Checks
- `GET /health` - Full health check (DB + Redis)
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### API v1
- `GET /api/v1/` - Welcome message

## Project Structure
```
joblisting/
├── backend/                    # Go backend service
│   ├── cmd/                   # Application entry points
│   ├── internal/              # Private application code
│   │   ├── config/           # Configuration management
│   │   ├── database/         # Database connections
│   │   ├── domain/           # Data models
│   │   ├── handler/          # HTTP handlers
│   │   ├── middleware/       # HTTP middleware
│   │   ├── repository/       # Data access layer
│   │   ├── router/           # Route definitions
│   │   ├── service/          # Business logic
│   │   └── storage/          # File storage (MinIO)
│   ├── migrations/           # Database migrations
│   ├── Dockerfile           # Backend container
│   └── Makefile             # Development commands
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and API client
│   │   ├── store/           # Zustand state stores
│   │   └── types/           # TypeScript types
│   ├── Dockerfile           # Frontend container
│   └── package.json
├── scripts/                    # Deployment scripts
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Development services
├── docker-compose.prod.yml     # Production deployment
└── README.md
```

## Development Workflow

1. **Start services**: `make dev`
2. **Make changes** to Go files
3. **Air automatically reloads** the application
4. **Test** at http://localhost:8080

## Testing Health Check
```bash
# Test health endpoint
curl http://localhost:8080/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "services": {
    "postgres": "healthy",
    "redis": "healthy"
  }
}
```

## Next Steps

After confirming the setup works:

1. ✅ Services running
2. ✅ Health checks passing
3. ✅ Hot reload working

You're ready to implement:
- User authentication
- Job listings CRUD
- Search functionality
- File uploads
- And more...

## Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# Check logs
make logs

# Clean and restart
make clean
make up
```

### Port already in use
```bash
# Check what's using the port
lsof -i :8080

# Change port in .env file
APP_PORT=8081
```

### Database connection issues
```bash
# Check PostgreSQL is running
make ps

# Connect to database
make db-shell
```

## Environment Variables

See `.env` file for all configuration options.

Key variables:
- `APP_PORT` - API server port (default: 8080)
- `DB_HOST` - PostgreSQL host (default: postgres)
- `REDIS_HOST` - Redis host (default: redis)

## 📚 Documentation

### Integration Guides
- **[API_INTEGRATION_SUMMARY.md](API_INTEGRATION_SUMMARY.md)** - Complete API integration details
- **[INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)** - Integration overview and testing guide
- **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)** - Frontend architecture and setup
- **[BACKEND_INTEGRATION_STATUS.md](BACKEND_INTEGRATION_STATUS.md)** - Backend endpoint status

### Implementation Guides
- **[FRONTEND_API_INTEGRATION.md](FRONTEND_API_INTEGRATION.md)** - API integration instructions
- **[JOB_MANAGEMENT_IMPLEMENTATION.md](JOB_MANAGEMENT_IMPLEMENTATION.md)** - Job management features
- **[COMPANY_PROFILE_IMPLEMENTATION.md](COMPANY_PROFILE_IMPLEMENTATION.md)** - Company profile features
- **[USER_PROFILE_IMPLEMENTATION.md](USER_PROFILE_IMPLEMENTATION.md)** - User profile features

### Setup & Configuration
- **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - Quick start instructions
- **[LOCAL_SETUP_INSTRUCTIONS.md](LOCAL_SETUP_INSTRUCTIONS.md)** - Detailed local setup
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

## 🎯 Features

### ✅ Implemented & Working

**Authentication**
- User registration (Job Seeker & Employer)
- Email/password login
- JWT token management with auto-refresh
- Google OAuth integration (requires client ID)
- Password reset flow
- Email verification

**Jobs**
- Browse jobs with pagination
- Advanced search and filtering
- Job categories
- Featured jobs section
- Job details pages
- Save/bookmark jobs
- Job application (ready for backend)

**Companies**
- Browse companies with pagination
- Company profiles
- Company jobs listing
- Office locations
- Employee benefits
- Company reviews
- Follow/unfollow companies

**UI/UX**
- Fully responsive design (mobile → desktop)
- Dark mode toggle
- Loading states with skeletons
- Error handling with retry
- Toast notifications
- Empty states

## 🧪 Testing

### Test Backend Connection
```bash
cd frontend
node test-backend-connection.js
```

### Manual Testing
1. Visit http://localhost:3001
2. Register a new account at /register
3. Login at /login
4. Browse jobs at /jobs
5. Search and filter jobs
6. View job details
7. Save a job (requires login)
8. Browse companies at /companies
9. Follow a company (requires login)
10. Test dark mode toggle
11. Test responsive design (resize browser)

For detailed testing checklist, see [API_INTEGRATION_SUMMARY.md](API_INTEGRATION_SUMMARY.md).

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

### Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **CI** | Push/PR to main | Runs tests, linting, and builds |
| **Deploy** | Push to main | Builds Docker images and deploys to server |
| **PR Check** | Pull requests | Validates PR title and checks changes |

### Setting up CI/CD

1. **Configure GitHub Secrets** (Settings > Secrets > Actions):

   | Secret | Description |
   |--------|-------------|
   | `SERVER_HOST` | Your server IP address |
   | `SERVER_USER` | SSH username (e.g., root) |
   | `SERVER_PASSWORD` | SSH password for server access |
   | `GH_PAT` | GitHub Personal Access Token (for pulling images) |
   | `DB_USER` | PostgreSQL username |
   | `DB_PASSWORD` | PostgreSQL password |
   | `DB_NAME` | Database name |
   | `JWT_SECRET` | JWT signing secret |
   | `MEILI_MASTER_KEY` | Meilisearch master key |
   | `MINIO_ACCESS_KEY` | MinIO access key |
   | `MINIO_SECRET_KEY` | MinIO secret key |
   | `GOOGLE_CLIENT_ID` | Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
   | `GOOGLE_REDIRECT_URL` | Google OAuth redirect URL |
   | `RESEND_API_KEY` | Resend email API key |
   | `RESEND_FROM_EMAIL` | Email sender address |
   | `NEXT_PUBLIC_API_URL` | Backend API URL |
   | `FRONTEND_URL` | Frontend public URL |

2. **First-time Server Setup**:
   ```bash
   # SSH into your server
   ssh root@your-server-ip

   # Install Docker
   curl -fsSL https://get.docker.com | sh

   # Create app directory
   mkdir -p /opt/job-platform
   ```

3. **Deployment**:
   - Push to `main` branch triggers automatic deployment
   - Docker images are built and pushed to GitHub Container Registry
   - Server pulls the latest images and restarts services

## Production Deployment

### Using Docker Compose

```bash
# Copy production compose file to server
scp docker-compose.prod.yml root@your-server:/opt/job-platform/

# Create .env file with your configuration
# Then start services
cd /opt/job-platform
docker-compose -f docker-compose.prod.yml up -d
```

### Health Checks

- Backend: `http://your-server:8080/health`
- Frontend: `http://your-server:3000`

## License

MIT
