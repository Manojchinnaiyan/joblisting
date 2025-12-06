#!/bin/bash
# Database backup script with Google Drive sync
# This script creates a PostgreSQL backup and uploads it to Google Drive

set -e

# Configuration
BACKUP_DIR="/opt/job-platform/backups"
GDRIVE_REMOTE="gdrive:job-platform-backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="db_${DATE}.sql.gz"

echo "=== Database Backup Started at $(date) ==="

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Create database backup
echo "[1/4] Creating database backup..."
docker exec job_postgres pg_dump -U "${DB_USER:-postgres}" -d "${DB_NAME:-jobdb}" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Check backup was created successfully
if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file was not created!"
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Upload to Google Drive
echo "[2/4] Uploading to Google Drive..."
if command -v rclone &> /dev/null; then
    rclone copy "${BACKUP_DIR}/${BACKUP_FILE}" "$GDRIVE_REMOTE/" --progress
    echo "Upload completed!"
else
    echo "WARNING: rclone not installed, skipping Google Drive upload"
fi

# Clean up old local backups (keep last 7 days locally)
echo "[3/4] Cleaning old local backups..."
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete
echo "Local cleanup done (kept last 7 days)"

# Clean up old remote backups (keep last 30 days on Google Drive)
echo "[4/4] Cleaning old remote backups..."
if command -v rclone &> /dev/null; then
    rclone delete "$GDRIVE_REMOTE/" --min-age ${RETENTION_DAYS}d --progress 2>/dev/null || true
    echo "Remote cleanup done (kept last ${RETENTION_DAYS} days)"
fi

echo "=== Backup Completed at $(date) ==="
echo "Local: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "Remote: ${GDRIVE_REMOTE}/${BACKUP_FILE}"
