#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Job Platform Server Setup ===${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# Install required packages
echo -e "${YELLOW}Installing required packages...${NC}"
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Enable Docker service
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

# Create application directory
echo -e "${YELLOW}Creating application directory...${NC}"
mkdir -p /opt/job-platform/scripts
mkdir -p /opt/job-platform/nginx/ssl

# Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Frontend (direct access)
ufw allow 8080/tcp  # Backend (direct access)
ufw --force enable

# Create systemd service for the application
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > /etc/systemd/system/job-platform.service << 'EOF'
[Unit]
Description=Job Platform Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/job-platform
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable job-platform

# Create log rotation
echo -e "${YELLOW}Setting up log rotation...${NC}"
cat > /etc/logrotate.d/job-platform << 'EOF'
/opt/job-platform/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
EOF

echo ""
echo -e "${GREEN}=== Server Setup Complete ===${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy docker-compose.prod.yml to /opt/job-platform/"
echo "2. Create .env file in /opt/job-platform/ with your configuration"
echo "3. Run: cd /opt/job-platform && docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  - Start: systemctl start job-platform"
echo "  - Stop: systemctl stop job-platform"
echo "  - Status: systemctl status job-platform"
echo "  - Logs: docker-compose -f /opt/job-platform/docker-compose.prod.yml logs -f"
