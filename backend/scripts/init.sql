-- Initial database setup
-- This runs automatically when PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial tables (basic structure for testing)
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO health_check (checked_at) VALUES (CURRENT_TIMESTAMP);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
