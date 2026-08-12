#!/usr/bin/env sh
cd "$(dirname "$0")"
echo "Open http://localhost:8765 in your browser."
python3 -m http.server 8765
