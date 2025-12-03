# Deployment Guide

This guide explains how to set up CI/CD for deploying the Job Platform to your server.

## Prerequisites

- A GitHub repository for this project
- A Linux server (Ubuntu/Debian recommended) with:
  - Docker installed
  - Docker Compose installed
  - SSH access enabled (password authentication)

## Step 1: Configure GitHub Secrets

Go to your GitHub repository: **Settings > Secrets and variables > Actions**

Add the following secrets:

### Server Connection (Password Authentication)

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | Your server IP (e.g., `158.220.98.100`) |
| `SERVER_USER` | `root` |
| `SERVER_PASSWORD` | Your server SSH password |
| `GH_PAT` | GitHub Personal Access Token (for pulling images) |

> **Note**: To create a GitHub Personal Access Token (GH_PAT):
> 1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
> 2. Generate new token with `read:packages` and `write:packages` scopes
> 3. Copy the token and add it as `GH_PAT` secret

### Database

| Secret | Value |
|--------|-------|
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | Generate a strong password |
| `DB_NAME` | `jobdb` |

### Security

| Secret | Value |
|--------|-------|
| `JWT_SECRET` | Generate a 64-character random string |
| `MEILI_MASTER_KEY` | Generate a strong master key |
| `REDIS_PASSWORD` | (optional) Redis password |

### MinIO Storage

| Secret | Value |
|--------|-------|
| `MINIO_ACCESS_KEY` | Your MinIO access key (e.g., `minioadmin`) |
| `MINIO_SECRET_KEY` | Your MinIO secret key |

### OAuth (Google)

| Secret | Value |
|--------|-------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret |
| `GOOGLE_REDIRECT_URL` | `http://YOUR_SERVER_IP:8080/api/v1/auth/google/callback` |

### Email (Resend)

| Secret | Value |
|--------|-------|
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` |

### URLs

| Secret | Value |
|--------|-------|
| `FRONTEND_URL` | `http://YOUR_SERVER_IP:3000` |
| `ADMIN_FRONTEND_URL` | `http://YOUR_SERVER_IP:3001` |
| `NEXT_PUBLIC_API_URL` | `http://YOUR_SERVER_IP:8080/api/v1` |

## Step 2: Prepare Your Server

SSH into your server:

```bash
ssh root@YOUR_SERVER_IP
```

Run these commands to set up Docker:

```bash
# Create application directory
mkdir -p /opt/job-platform

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose (if not installed)
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Configure firewall (optional but recommended)
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3000  # Frontend
ufw allow 8080  # Backend
ufw enable
```

## Step 3: Push Your Code

1. Initialize Git (if not already done):
   ```bash
   cd /path/to/joblisting
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Add GitHub remote:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/joblisting.git
   git branch -M main
   git push -u origin main
   ```

3. The GitHub Actions workflow will automatically:
   - Run tests
   - Build Docker images
   - Push images to GitHub Container Registry
   - Deploy to your server using password authentication

## Step 4: Monitor Deployment

- Go to your repository on GitHub
- Click on **Actions** tab
- Watch the deployment progress

## Accessing Your Application

After successful deployment:

- **Frontend**: http://YOUR_SERVER_IP:3000
- **Backend API**: http://YOUR_SERVER_IP:8080/api/v1
- **Health Check**: http://YOUR_SERVER_IP:8080/health

## Troubleshooting

### Check Docker logs

```bash
ssh root@YOUR_SERVER_IP
cd /opt/job-platform
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart services

```bash
docker-compose -f docker-compose.prod.yml restart
```

### View running containers

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Manual deployment

```bash
cd /opt/job-platform

# Login to GitHub Container Registry
echo "YOUR_GH_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull and start
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Why Password vs SSH Key?

**Password authentication** (what we're using):
- Simpler to set up - just add your password as a secret
- Works immediately without additional configuration
- Fine for personal projects

**SSH Key authentication** (more secure):
- More secure for production environments
- Keys are harder to brute-force than passwords
- Recommended for team environments

You can switch to SSH keys later by:
1. Generating a key pair on your local machine
2. Adding the public key to your server's `~/.ssh/authorized_keys`
3. Adding the private key as `SSH_PRIVATE_KEY` secret
4. Modifying the workflow to use SSH instead of sshpass

## Security Recommendations

1. **Change default passwords** - Never use default passwords in production
2. **Use HTTPS** - Set up SSL/TLS with Let's Encrypt
3. **Restrict database access** - Don't expose PostgreSQL port publicly
4. **Regular updates** - Keep Docker images and system packages updated
5. **Backup data** - Set up regular backups for PostgreSQL and MinIO

## Setting up HTTPS (Optional but Recommended)

Install Nginx and Certbot:

```bash
apt install nginx certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com
```
