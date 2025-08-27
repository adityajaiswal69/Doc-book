-- Add sharing functionality to documents table
-- This migration adds preview tokens and sharing settings

-- Add preview_token column to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS preview_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS share_children boolean DEFAULT false;

-- Create unique index on preview_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_preview_token 
ON public.documents(preview_token) 
WHERE preview_token IS NOT NULL;

-- Create index on is_public for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_is_public 
ON public.documents(is_public) 
WHERE is_public = true;

-- Create index on share_children for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_share_children 
ON public.documents(share_children) 
WHERE share_children = true;

-- Function to generate a new preview token
CREATE OR REPLACE FUNCTION generate_preview_token()
RETURNS uuid AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Function to get shared documents (for preview)
CREATE OR REPLACE FUNCTION get_shared_documents(token uuid)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  blocks_content jsonb,
  type text,
  parent_id uuid,
  order_index integer,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  -- Return the main document if it matches the token
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    d.blocks_content,
    d.type,
    d.parent_id,
    d.order_index,
    d.created_at,
    d.updated_at
  FROM public.documents d
  WHERE d.preview_token = token AND d.is_public = true;
  
  -- If the main document has share_children = true, also return all child documents
  RETURN QUERY
  SELECT 
    child.id,
    child.title,
    child.content,
    child.blocks_content,
    child.type,
    child.parent_id,
    child.order_index,
    child.created_at,
    child.updated_at
  FROM public.documents d
  JOIN public.documents child ON child.parent_id = d.id
  WHERE d.preview_token = token 
    AND d.is_public = true 
    AND d.share_children = true
  ORDER BY child.order_index;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_shared_documents(uuid) TO anon;
GRANT EXECUTE ON FUNCTION generate_preview_token() TO authenticated;

