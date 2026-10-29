#!/bin/bash

# Rollback script for production deployment
# Usage: ./rollback.sh [version]

set -e

VERSION=${1:-previous}
DEPLOY_DIR="/opt/counseling-queue"
BACKUP_DIR="/opt/backups/counseling-queue"

echo "=== Rollback Procedure ==="
echo "Target version: $VERSION"
echo "Timestamp: $(date -Iseconds)"

# Stop current application
echo "Stopping application..."
systemctl stop counseling-queue || true

# Restore from backup
if [ "$VERSION" = "previous" ]; then
  LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -n1)
  echo "Restoring from latest backup: $LATEST_BACKUP"
  rsync -av $BACKUP_DIR/$LATEST_BACKUP/ $DEPLOY_DIR/
else
  echo "Restoring from version: $VERSION"
  rsync -av $BACKUP_DIR/$VERSION/ $DEPLOY_DIR/
fi

# Restart application
echo "Starting application..."
systemctl start counseling-queue

# Verify health
sleep 5
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
  echo "✓ Rollback successful - health check passed"
  exit 0
else
  echo "✗ Rollback failed - health check failed"
  exit 1
fi