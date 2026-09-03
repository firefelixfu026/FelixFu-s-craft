#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${DEPLOY_PATH:-/opt/felixfu-blog}"
cd "$PROJECT_DIR"

echo "Deploying FelixFu blog from $PROJECT_DIR"

if [[ "${SKIP_GIT_PULL:-0}" != "1" ]]; then
  for attempt in 1 2 3; do
    if git -c http.version=HTTP/1.1 pull --ff-only; then
      break
    fi

    if [[ "$attempt" -eq 3 ]]; then
      echo "git pull failed after 3 attempts" >&2
      exit 1
    fi

    echo "git pull failed; retrying in $((attempt * 5)) seconds..." >&2
    sleep $((attempt * 5))
  done
fi

docker compose up -d --build

docker compose ps

curl -f http://127.0.0.1:8000/api/health >/dev/null
curl -f -I http://127.0.0.1:8080 >/dev/null

echo "Deployment finished successfully."
