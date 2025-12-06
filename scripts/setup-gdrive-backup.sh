#!/bin/bash
# Setup script for Google Drive backups
# Run this once on your server to configure rclone

set -e

echo "=== Google Drive Backup Setup ==="
echo ""

# Install rclone if not present
if ! command -v rclone &> /dev/null; then
    echo "[1/3] Installing rclone..."
    curl https://rclone.org/install.sh | sudo bash
else
    echo "[1/3] rclone already installed: $(rclone version | head -1)"
fi

# Configure rclone for Google Drive
echo ""
echo "[2/3] Configuring Google Drive..."
echo ""
echo "You'll need to authenticate with Google. Follow these steps:"
echo ""
echo "1. Run: rclone config"
echo "2. Choose 'n' for new remote"
echo "3. Name it: gdrive"
echo "4. Choose 'drive' (Google Drive)"
echo "5. Leave client_id and client_secret blank (press Enter)"
echo "6. Choose '1' for full access"
echo "7. Leave root_folder_id blank"
echo "8. Leave service_account_file blank"
echo "9. Choose 'n' for advanced config"
echo "10. Choose 'n' for auto config (since this is a remote server)"
echo "11. Copy the URL shown, open it in YOUR browser"
echo "12. Sign in to Google and authorize"
echo "13. Copy the verification code back to the terminal"
echo "14. Choose 'n' for team drive"
echo "15. Confirm with 'y'"
echo ""
read -p "Press Enter to start rclone config..."

rclone config

# Test the connection
echo ""
echo "[3/3] Testing Google Drive connection..."
if rclone lsd gdrive: 2>/dev/null; then
    echo "✓ Google Drive connected successfully!"

    # Create backup folder
    rclone mkdir gdrive:job-platform-backups 2>/dev/null || true
    echo "✓ Created backup folder: job-platform-backups"
else
    echo "✗ Google Drive connection failed. Please run 'rclone config' again."
    exit 1
fi

# Setup cron job for daily backups
echo ""
echo "Setting up daily backup cron job..."
CRON_CMD="0 2 * * * cd /opt/job-platform && source .env && /opt/job-platform/scripts/backup-to-gdrive.sh >> /var/log/backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-to-gdrive.sh"; then
    echo "Cron job already exists"
else
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    echo "✓ Daily backup scheduled at 2:00 AM"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Backups will run daily at 2:00 AM and upload to Google Drive."
echo ""
echo "To run a backup manually:"
echo "  cd /opt/job-platform && source .env && ./scripts/backup-to-gdrive.sh"
echo ""
echo "To check backup logs:"
echo "  tail -f /var/log/backup.log"
echo ""
echo "To list backups on Google Drive:"
echo "  rclone ls gdrive:job-platform-backups"
