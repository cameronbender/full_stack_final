-- Create the schema
CREATE SCHEMA IF NOT EXISTS pdf;
-- Create the table to store PDF files
CREATE TABLE IF NOT EXISTS pdf.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    content BYTEA NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);