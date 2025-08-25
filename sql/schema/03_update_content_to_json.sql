-- Migration to update documents table to support JSON content for blocks
-- This allows storing structured block data instead of plain text

-- First, let's create a backup of the current content
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_backup text;

-- Copy existing content to backup
UPDATE public.documents SET content_backup = content WHERE content_backup IS NULL;

-- Add a new JSONB column for structured block content
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS blocks_content jsonb DEFAULT '[]'::jsonb;

-- Create an index for the JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_blocks_content_gin ON public.documents USING gin (blocks_content);

-- Add a trigger to automatically update the content field when blocks_content changes
-- This maintains backward compatibility
CREATE OR REPLACE FUNCTION update_content_from_blocks()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert blocks_content JSON to plain text content for backward compatibility
  IF NEW.blocks_content IS NOT NULL THEN
    NEW.content = (
      SELECT string_agg(
        CASE 
          WHEN block->>'type' = 'heading-1' THEN '# ' || (block->>'content')
          WHEN block->>'type' = 'heading-2' THEN '## ' || (block->>'content')
          WHEN block->>'type' = 'heading-3' THEN '### ' || (block->>'content')
          WHEN block->>'type' = 'bulleted-list' THEN '- ' || (block->>'content')
          WHEN block->>'type' = 'numbered-list' THEN '1. ' || (block->>'content')
          WHEN block->>'type' = 'todo-list' THEN '- [ ] ' || (block->>'content')
          WHEN block->>'type' = 'quote' THEN '> ' || (block->>'content')
          WHEN block->>'type' = 'code-block' THEN '```' || E'\n' || (block->>'content') || E'\n```'
          WHEN block->>'type' = 'divider' THEN '---'
          ELSE block->>'content'
        END,
        E'\n'
      )
      FROM jsonb_array_elements(NEW.blocks_content) AS block
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_content_from_blocks ON public.documents;
CREATE TRIGGER trigger_update_content_from_blocks
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_content_from_blocks();

-- Add a function to convert existing plain text content to JSON blocks
CREATE OR REPLACE FUNCTION convert_content_to_blocks(document_id uuid)
RETURNS void AS $$
DECLARE
  doc_content text;
  doc_blocks jsonb;
BEGIN
  -- Get the document content
  SELECT content INTO doc_content FROM documents WHERE id = document_id;
  
  IF doc_content IS NULL OR doc_content = '' THEN
    -- Empty content, set empty blocks array
    UPDATE documents SET blocks_content = '[]'::jsonb WHERE id = document_id;
    RETURN;
  END IF;
  
  -- Convert plain text to blocks (this is a simplified conversion)
  -- In practice, the frontend will handle the proper conversion
  doc_blocks = jsonb_build_array(
    jsonb_build_object(
      'id', 'block-0',
      'type', 'text',
      'content', doc_content
    )
  );
  
  -- Update the document with the converted blocks
  UPDATE documents SET blocks_content = doc_blocks WHERE id = document_id;
END;
$$ LANGUAGE plpgsql;

-- Convert all existing documents to use the new blocks format
-- This will be run by the application when needed
-- SELECT convert_content_to_blocks(id) FROM documents WHERE blocks_content IS NULL OR blocks_content = '[]'::jsonb;
