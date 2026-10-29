#!/bin/bash

# Deployment script with backup and rollback capability
set -e

VERSION=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="/opt/counseling-queue"
BACKUP_DIR="/opt/backups/counseling-queue"

echo "=== Deployment Procedure ==="
echo "Version: $VERSION"
echo "Timestamp: $(date -Iseconds)"

# Create backup of current version
echo "Creating backup..."
mkdir -p $BACKUP_DIR
if [ -d "$DEPLOY_DIR" ]; then
  rsync -av $DEPLOY_DIR/ $BACKUP_DIR/$VERSION/
  echo "Backup created: $BACKUP_DIR/$VERSION"
fi

# Deploy new version
echo "Deploying new version..."
rsync -av ./ $DEPLOY_DIR/ --exclude=node_modules --exclude=.env

# Install dependencies
cd $DEPLOY_DIR
npm ci --only=production

# Restart application
echo "Restarting application..."
systemctl restart counseling-queue

# Verify health
sleep 5
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
  echo "✓ Deployment successful - health check passed"
  echo "Rollback command: ./rollback.sh $VERSION"
  exit 0
else
  echo "✗ Deployment failed - initiating rollback"
  ./rollback.sh $VERSION
  exit 1
fi