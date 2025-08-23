-- Update SQL for Essential Blocks - Adds missing features to existing database
-- This file will work with your existing supabase-migration.sql without dropping tables

-- Add missing indexes for essential functionality (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_documents_content_length ON documents(LENGTH(content));
CREATE INDEX IF NOT EXISTS idx_documents_title_length ON documents(LENGTH(title));

-- Add simple function for content updates (essential blocks only) - replaces the complex one
CREATE OR REPLACE FUNCTION update_document_content_simple(
  doc_id UUID,
  new_content TEXT,
  user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has access to document
  IF EXISTS(
    SELECT 1 FROM user_rooms 
    WHERE room_id = doc_id 
    AND user_id = user_uuid
  ) THEN
    -- Update document content
    UPDATE documents 
    SET content = new_content, updated_at = NOW()
    WHERE id = doc_id;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add sample welcome document for testing (only if no documents exist)
INSERT INTO documents (title, content) 
SELECT 'Welcome Document', '# Welcome to Your Document Editor

## Getting Started
- Type `/` to open the command palette
- Select from available blocks
- Start writing your content

## Available Blocks
- **Headings**: H1, H2, H3
- **Lists**: Bulleted and numbered
- **Text**: Plain text blocks
- **Code**: Code snippets
- **Quotes**: Blockquotes
- **Tasks**: Checkbox lists

Enjoy writing!'
WHERE NOT EXISTS (SELECT 1 FROM documents LIMIT 1);

-- Grant necessary permissions (if not already granted)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON user_rooms TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_content_simple TO authenticated;

-- Verify the essential structure is in place
DO $$
BEGIN
  -- Check if documents table has required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'content' 
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'Adding content column to documents table...';
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
  END IF;

  -- Check if trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_documents_updated_at'
  ) THEN
    RAISE NOTICE 'Creating updated_at trigger...';
    CREATE TRIGGER update_documents_updated_at 
      BEFORE UPDATE ON documents 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'documents' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'Enabling RLS on documents table...';
    ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'user_rooms' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'Enabling RLS on user_rooms table...';
    ALTER TABLE user_rooms ENABLE ROW LEVEL SECURITY;
  END IF;

  RAISE NOTICE 'Essential blocks update completed successfully!';
END $$;
