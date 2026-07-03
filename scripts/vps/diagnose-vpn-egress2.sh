#!/usr/bin/env bash
echo "=== telegram ==="
curl -sI --max-time 8 https://web.telegram.org 2>&1 | head -5
echo "=== instagram ==="
curl -sI --max-time 8 https://www.instagram.com 2>&1 | head -5
echo "=== youtube ip direct ==="
curl -sv --max-time 10 --resolve www.youtube.com:443:173.194.221.198 https://www.youtube.com/ 2>&1 | tail -8
