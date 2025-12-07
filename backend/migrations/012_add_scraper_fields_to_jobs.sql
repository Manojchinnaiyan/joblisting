-- Migration: Add scraper fields to jobs table
-- Description: Adds fields to support web scraping of job postings

-- Add original_url column - stores the source URL where job was scraped from
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS original_url VARCHAR(1000);

-- Add scraped_data column - stores raw scraped data in JSON format
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scraped_data JSONB;

-- Add scrape_status column - tracks the scraping status
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scrape_status VARCHAR(20) DEFAULT 'manual';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_jobs_original_url ON jobs(original_url);
CREATE INDEX IF NOT EXISTS idx_jobs_scrape_status ON jobs(scrape_status);

-- Add comments for documentation
COMMENT ON COLUMN jobs.original_url IS 'Original URL where job was scraped from';
COMMENT ON COLUMN jobs.scraped_data IS 'Raw scraped data in JSON format';
COMMENT ON COLUMN jobs.scrape_status IS 'Scraping status: pending, scraped, failed, manual';
