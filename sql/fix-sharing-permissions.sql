-- Comprehensive fix for sharing functionality
-- This script addresses all permission and access issues

-- 1. First, ensure sharing columns exist
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS preview_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS share_children boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS blocks_content jsonb DEFAULT '[]'::jsonb;

-- 2. Create indexes for better performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_preview_token 
ON public.documents(preview_token) 
WHERE preview_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_is_public 
ON public.documents(is_public) 
WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_documents_share_children 
ON public.documents(share_children) 
WHERE share_children = true;

CREATE INDEX IF NOT EXISTS idx_documents_blocks_content_gin 
ON public.documents USING gin (blocks_content);

-- 3. Create or replace the sharing functions
-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS generate_preview_token();

CREATE OR REPLACE FUNCTION generate_preview_token()
RETURNS uuid AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Drop the existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_shared_documents(uuid);

-- Enhanced function to get shared documents with better error handling
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
  updated_at timestamptz,
  preview_token uuid,
  is_public boolean,
  share_children boolean
) AS $$
BEGIN
  -- Return the main document if it matches the token and is public
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    COALESCE(d.blocks_content, '[]'::jsonb) as blocks_content,
    d.type,
    d.parent_id,
    d.order_index,
    d.created_at,
    d.updated_at,
    d.preview_token,
    d.is_public,
    d.share_children
  FROM public.documents d
  WHERE d.preview_token = token AND d.is_public = true;
  
  -- If the main document has share_children = true, also return all child documents
  RETURN QUERY
  SELECT 
    child.id,
    child.title,
    child.content,
    COALESCE(child.blocks_content, '[]'::jsonb) as blocks_content,
    child.type,
    child.parent_id,
    child.order_index,
    child.created_at,
    child.updated_at,
    child.preview_token,
    child.is_public,
    child.share_children
  FROM public.documents d
  JOIN public.documents child ON child.parent_id = d.id
  WHERE d.preview_token = token 
    AND d.is_public = true 
    AND d.share_children = true
  ORDER BY child.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant necessary permissions
-- Grant SELECT permission on documents table to anonymous users for public documents
GRANT SELECT ON public.documents TO anon;

-- Grant EXECUTE permission on functions
GRANT EXECUTE ON FUNCTION get_shared_documents(uuid) TO anon;
GRANT EXECUTE ON FUNCTION generate_preview_token() TO authenticated;

-- 5. Create RLS policy to allow anonymous access to public documents
-- First, drop existing policies that might block access
DROP POLICY IF EXISTS "Allow anonymous read access to public documents" ON public.documents;

-- Create new policy for anonymous access to public documents
CREATE POLICY "Allow anonymous read access to public documents" ON public.documents
FOR SELECT TO anon
USING (is_public = true);

-- 6. Create policy for authenticated users to access their own documents
DROP POLICY IF EXISTS "Users can view documents they have access to" ON public.documents;

CREATE POLICY "Users can view documents they have access to" ON public.documents
FOR SELECT TO authenticated
USING (
  -- Users can see their own documents
  EXISTS (
    SELECT 1 FROM user_rooms 
    WHERE user_rooms.room_id = documents.id 
    AND user_rooms.user_id = auth.uid()::text
  )
  OR 
  -- Users can see public documents
  is_public = true
);

-- 7. Create policy for document owners to update their documents
DROP POLICY IF EXISTS "Document owners can update their documents" ON public.documents;

CREATE POLICY "Document owners can update their documents" ON public.documents
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_rooms 
    WHERE user_rooms.room_id = documents.id 
    AND user_rooms.user_id = auth.uid()::text
    AND user_rooms.role = 'owner'
  )
);

-- 8. Create policy for document owners to delete their documents
DROP POLICY IF EXISTS "Document owners can delete their documents" ON public.documents;

CREATE POLICY "Document owners can delete their documents" ON public.documents
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_rooms 
    WHERE user_rooms.room_id = documents.id 
    AND user_rooms.user_id = auth.uid()::text
    AND user_rooms.role = 'owner'
  )
);

-- 9. Create policy for document owners to insert new documents
DROP POLICY IF EXISTS "Users can insert documents" ON public.documents;

CREATE POLICY "Users can insert documents" ON public.documents
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_rooms 
    WHERE user_rooms.room_id = documents.id 
    AND user_rooms.user_id = auth.uid()::text
    AND user_rooms.role = 'owner'
  )
  OR
  -- Allow inserting documents without user_rooms entry (for new documents)
  NOT EXISTS (
    SELECT 1 FROM user_rooms 
    WHERE user_rooms.room_id = documents.id
  )
);

-- 10. Ensure RLS is enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 11. Create a function to safely update document sharing settings
-- Drop existing function first
DROP FUNCTION IF EXISTS update_document_sharing(uuid, boolean, boolean, text);

CREATE OR REPLACE FUNCTION update_document_sharing(
  doc_id uuid,
  is_public_setting boolean,
  share_children_setting boolean,
  user_uuid text
)
RETURNS boolean AS $$
DECLARE
  has_access boolean;
BEGIN
  -- Check if user has owner access to document
  SELECT EXISTS(
    SELECT 1 FROM user_rooms 
    WHERE room_id = doc_id 
    AND user_id = user_uuid
    AND role = 'owner'
  ) INTO has_access;
  
  IF NOT has_access THEN
    RETURN false;
  END IF;
  
  -- Update document sharing settings
  UPDATE documents 
  SET 
    is_public = is_public_setting,
    share_children = share_children_setting,
    updated_at = NOW()
  WHERE id = doc_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the sharing function
GRANT EXECUTE ON FUNCTION update_document_sharing(uuid, boolean, boolean, text) TO authenticated;

-- 12. Create a function to get all public documents (for debugging)
-- Drop existing function first
DROP FUNCTION IF EXISTS get_all_public_documents();

CREATE OR REPLACE FUNCTION get_all_public_documents()
RETURNS TABLE (
  id uuid,
  title text,
  preview_token uuid,
  is_public boolean,
  share_children boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.preview_token,
    d.is_public,
    d.share_children,
    d.created_at
  FROM public.documents d
  WHERE d.is_public = true
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_public_documents() TO anon;
