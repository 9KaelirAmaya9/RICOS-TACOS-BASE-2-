
#!/bin/bash
# Digital Ocean Deploy Script
# Usage: ./deploy.sh [--dry-run] [--help|-h]
# Deploys app to Digital Ocean using PyDo and environment variables.
#
# Exits nonzero on error. Requires .env to be configured.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../../.."
cd "$PROJECT_ROOT"

if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo "Usage: ./services/digital_ocean/scripts/deploy.sh [--dry-run]"
  echo "Deploys app to Digital Ocean using PyDo."
  exit 0
fi

# Activate Python venv if exists
if [ -f ".venv/bin/activate" ]; then
	source .venv/bin/activate
elif [ -f ".venv/Scripts/activate" ]; then
	source .venv/Scripts/activate
fi

export PYTHONPATH="${PROJECT_ROOT}/services:$PYTHONPATH"
python services/digital_ocean/deploy.py "$@"
