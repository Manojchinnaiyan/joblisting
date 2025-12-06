#!/bin/bash
set -e

# This script ensures the database exists
# It runs every time PostgreSQL starts, not just on first initialization

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -h localhost; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

# Check if database exists, create if not
DB_EXISTS=$(psql -U "$POSTGRES_USER" -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
  echo "Database '$POSTGRES_DB' does not exist. Creating..."
  psql -U "$POSTGRES_USER" -h localhost -c "CREATE DATABASE \"$POSTGRES_DB\";"
  echo "Database '$POSTGRES_DB' created successfully."
else
  echo "Database '$POSTGRES_DB' already exists."
fi

# Enable UUID extension if not exists
psql -U "$POSTGRES_USER" -h localhost -d "$POSTGRES_DB" -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' || true

echo "PostgreSQL initialization complete."
