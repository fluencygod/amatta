-- Initialize ClickHouse database for analytics
CREATE DATABASE IF NOT EXISTS analytics;
USE analytics;

-- Optional: tune settings at session scope for better JSON parsing tolerance
SET allow_experimental_analyzer = 1;

