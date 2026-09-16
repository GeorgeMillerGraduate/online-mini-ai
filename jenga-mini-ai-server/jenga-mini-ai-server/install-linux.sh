#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v node >/dev/null || { echo 'Install Node.js 22 or 24 LTS first (https://nodejs.org).'; exit 1; }
node scripts/install.mjs
