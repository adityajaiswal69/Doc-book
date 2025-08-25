-- Add blocks_content column to documents table
-- Run this in your Supabase SQL editor

-- Add the new JSONB column for structured block content
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS blocks_content jsonb DEFAULT '[]'::jsonb;

-- Create an index for the JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_blocks_content_gin ON public.documents USING gin (blocks_content);

-- Add a backup column for existing content
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_backup text;

-- Copy existing content to backup
UPDATE public.documents SET content_backup = content WHERE content_backup IS NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND table_schema = 'public' 
AND column_name = 'blocks_content';
