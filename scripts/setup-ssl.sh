#!/bin/bash
# SSL Certificate Setup Script for jobsworld.in
# Run this script on the production server after DNS is pointing to this server

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

# Create directories
mkdir -p /var/www/certbot
mkdir -p /etc/nginx/conf.d

# Stop nginx temporarily to free port 80
echo "Stopping nginx container..."
cd /opt/job-platform
docker stop job_nginx 2>/dev/null || true

# Obtain certificate
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
  docker start job_nginx
  exit 1
fi

# Copy SSL config to nginx conf.d
echo "Enabling SSL configuration..."
if [ -f "/opt/job-platform/nginx/ssl.conf" ]; then
  cp /opt/job-platform/nginx/ssl.conf /opt/job-platform/nginx/conf.d/ssl.conf
  echo "SSL config enabled"
fi

# Update docker-compose to mount conf.d directory
# This is handled by updating nginx volumes

# Start nginx
echo "Starting nginx..."
docker start job_nginx 2>/dev/null || docker compose -f /opt/job-platform/docker-compose.prod.yml up -d nginx

# Test nginx config
sleep 3
if docker exec job_nginx nginx -t 2>/dev/null; then
  echo "Nginx configuration is valid"
  docker exec job_nginx nginx -s reload
else
  echo "Warning: Nginx config test failed, checking logs..."
  docker logs job_nginx --tail=20
fi

# Set up auto-renewal cron job
echo "Setting up auto-renewal..."
CRON_JOB="0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'docker exec job_nginx nginx -s reload'"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -

echo "========================================"
echo "SSL Setup Complete!"
echo "========================================"
echo ""
echo "Your site should now be accessible at:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN (redirects to non-www)"
echo ""
echo "Auto-renewal: Configured (runs daily at 3 AM)"
