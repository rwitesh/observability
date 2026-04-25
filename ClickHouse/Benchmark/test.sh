#!/usr/bin/env bash

# Load .env from current directory
if [ -f ".env" ]; then
  set -o allexport
  source .env
  set +o allexport
else
  echo ".env file not found"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: $0 <sql-file>"
  exit 1
fi

SQL_FILE="$1"

if [ ! -f "$SQL_FILE" ]; then
  echo "File not found: $SQL_FILE"
  exit 1
fi

CMD="clickhouse benchmark \
  --host ${CH_HOST} \
  --port ${CH_PORT} \
  --user ${CH_USER} \
  --password ${CH_PASSWORD} \
  --database ${CH_DATABASE}"

if [ -n "${CH_CONCURRENCY}" ]; then
  CMD="$CMD --concurrency ${CH_CONCURRENCY}"
fi

if [ -n "${CH_ITERATION}" ]; then
  CMD="$CMD --iterations ${CH_ITERATION}"
fi

if [ "${CH_SECURE}" = "1" ]; then
  CMD="$CMD --secure"
fi

# Execute benchmark using normalized input
(cat "$SQL_FILE"; echo) | $CMD