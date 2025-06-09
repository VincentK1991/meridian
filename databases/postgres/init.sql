-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    oauth_integration JSON,
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Add oauth_integration column to users table (optional JSON field)
-- ALTER TABLE users ADD COLUMN oauth_integration JSON;

-- Optional: For better performance, consider using JSONB instead of JSON
-- JSONB provides better indexing and query performance for complex JSON operations
-- Uncomment the following lines to upgrade to JSONB:
-- ALTER TABLE users ALTER COLUMN oauth_integration TYPE JSONB USING oauth_integration::JSONB;
-- CREATE INDEX idx_users_oauth_integration_gin ON users USING GIN (oauth_integration);

-- Add email column to users table (optional string field)
-- ALTER TABLE users ADD COLUMN email VARCHAR(255);
-- ALTER TABLE users ADD COLUMN name VARCHAR(255);
-- Add updated_at column to users table
--ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add constraints to existing email column
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL;
-- ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Create sessions table with session_name
--CREATE TABLE sessions (
--    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
--    session_name VARCHAR(255) NOT NULL DEFAULT 'New Chat',
--    is_active BOOLEAN NOT NULL DEFAULT TRUE,
--    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
--);

-- Create messages table
-- CREATE TABLE messages (
--     message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
--     role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
--     content TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Create indexes for better query performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
--CREATE INDEX idx_messages_session_id ON messages(session_id);
-- CREATE INDEX idx_messages_created_at ON messages(created_at);

-- create a test user and a test session
-- Create test user
INSERT INTO users (user_id, email)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'test@test.com');

-- Create test session
--INSERT INTO sessions (session_id, user_id, created_at, is_active)
--VALUES ('ed42f9f0-7396-46e5-8bb1-8d12fddf231b', '123e4567-e89b-12d3-a456-426614174000', CURRENT_TIMESTAMP, TRUE);
