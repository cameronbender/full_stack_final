-- Users Table
-- Stores user account information
CREATE TABLE IF NOT EXISTS pdf.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    newsletter_subscribed BOOLEAN DEFAULT FALSE
);
-- Contact Messages Table
-- Stores messages submitted via the "Work With Us" form
CREATE TABLE IF NOT EXISTS pdf.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Proposals Table
-- Stores research proposals displayed on the Education page
-- Links to the PDF files stored in pdf.files
CREATE TABLE IF NOT EXISTS pdf.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    institution TEXT NOT NULL,
    supervisor TEXT,
    status TEXT DEFAULT 'Proposal',
    pdf_id UUID REFERENCES pdf.files(id),
    -- Foreign key to the PDF storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON pdf.users(email);
CREATE INDEX IF NOT EXISTS idx_proposals_pdf_id ON pdf.proposals(pdf_id);