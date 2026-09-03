#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${DEPLOY_PATH:-/opt/felixfu-blog}"
cd "$PROJECT_DIR"

echo "Deploying FelixFu blog from $PROJECT_DIR"

git pull --ff-only

docker compose up -d --build

docker compose ps

curl -f http://127.0.0.1:8000/api/health >/dev/null
curl -f -I http://127.0.0.1:8080 >/dev/null

echo "Deployment finished successfully."
