#!/bin/bash
# SSL Certificate Setup Script for jobsworld.in
# This script should be run on the production server

set -e

DOMAIN="jobsworld.in"
EMAIL="${SSL_EMAIL:-admin@jobsworld.in}"

echo "========================================"
echo "SSL Certificate Setup for $DOMAIN"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
  echo "Installing certbot..."
  apt-get update
  apt-get install -y certbot
fi

# Create webroot directory for ACME challenge
mkdir -p /var/www/certbot

# Stop nginx temporarily to free port 80
echo "Stopping nginx..."
docker stop job_nginx 2>/dev/null || true

# Obtain certificate using standalone mode (no webroot needed initially)
echo "Obtaining SSL certificate for $DOMAIN and www.$DOMAIN..."
certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --preferred-challenges http

# Verify certificate was created
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  echo "Certificate obtained successfully!"
  ls -la /etc/letsencrypt/live/$DOMAIN/
else
  echo "ERROR: Certificate not found!"
  exit 1
fi

# Restart nginx
echo "Starting nginx..."
docker start job_nginx 2>/dev/null || docker compose -f /opt/job-platform/docker-compose.prod.yml up -d nginx

# Set up auto-renewal cron job
echo "Setting up auto-renewal..."
CRON_JOB="0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'docker restart job_nginx'"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -

echo "========================================"
echo "SSL Setup Complete!"
echo "========================================"
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "Auto-renewal: Configured (runs daily at 3 AM)"
echo ""
echo "Next steps:"
echo "1. Update DNS A records to point to this server"
echo "2. Update GitHub secrets for the new domain URLs"
echo "3. Push the nginx config changes to trigger deployment"
