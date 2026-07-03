#!/usr/bin/env bash
echo "=== curl google ==="
curl -sI --max-time 10 https://www.google.com 2>&1 | head -8
echo "=== curl youtube verbose ==="
curl -sv --max-time 12 https://www.youtube.com 2>&1 | tail -15
echo "=== curl telegram ==="
curl -sI --max-time 10 https://web.telegram.org 2>&1 | head -6
echo "=== curl yandex ==="
curl -sI --max-time 10 https://yandex.ru 2>&1 | head -4
echo "=== ping 1.1.1.1 ==="
ping -c 2 -W 2 1.1.1.1 2>&1 | tail -3
echo "=== traceroute youtube ==="
traceroute -n -m 8 -w 2 108.177.14.136 2>&1 | head -10
