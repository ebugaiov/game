#!/bin/sh
set -e

# Runs only on the first initialization of an empty Postgres volume.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
  SELECT 'CREATE DATABASE ${POSTGRES_DB}_test'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}_test')\gexec
SQL
