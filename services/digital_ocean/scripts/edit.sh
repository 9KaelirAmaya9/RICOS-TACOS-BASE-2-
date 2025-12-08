#!/bin/bash
# Edit/Maintain CLI wrapper for Digital Ocean automation
# Usage: ./edit.sh [--dry-run]
# Requires: .env with Digital Ocean variables

set -e

if [ -z "$DO_API_TOKEN" ]; then
  echo "ERROR: DO_API_TOKEN is not set in environment." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../../.."
cd "$PROJECT_ROOT"

# Activate Python venv if exists
if [ -f ".venv/bin/activate" ]; then
	source .venv/bin/activate
elif [ -f ".venv/Scripts/activate" ]; then
	source .venv/Scripts/activate
fi

export PYTHONPATH="${PROJECT_ROOT}/services:$PYTHONPATH"
python services/digital_ocean/edit.py "$@"
