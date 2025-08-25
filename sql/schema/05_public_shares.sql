-- Add sharing fields to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS share_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS shared_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS share_scope text DEFAULT 'document' CHECK (share_scope IN ('document', 'folder'));

-- Create index for share_id lookups
CREATE INDEX IF NOT EXISTS idx_documents_share_id ON public.documents USING btree (share_id);

-- Create index for shared documents
CREATE INDEX IF NOT EXISTS idx_documents_is_shared ON public.documents USING btree (is_shared);

-- Create public_shares table for additional share metadata
CREATE TABLE IF NOT EXISTS public.public_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  share_id uuid NOT NULL UNIQUE,
  share_scope text NOT NULL DEFAULT 'document' CHECK (share_scope IN ('document', 'folder')),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  view_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone,
  CONSTRAINT public_shares_pkey PRIMARY KEY (id)
);

-- Create indexes for public_shares
CREATE INDEX IF NOT EXISTS idx_public_shares_share_id ON public.public_shares USING btree (share_id);
CREATE INDEX IF NOT EXISTS idx_public_shares_document_id ON public.public_shares USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_public_shares_created_at ON public.public_shares USING btree (created_at);

-- Function to generate a unique share ID
CREATE OR REPLACE FUNCTION generate_unique_share_id()
RETURNS uuid AS $$
DECLARE
  new_share_id uuid;
  attempts integer := 0;
BEGIN
  LOOP
    new_share_id := gen_random_uuid();
    attempts := attempts + 1;
    
    -- Check if share_id already exists in documents table
    IF NOT EXISTS (SELECT 1 FROM public.documents WHERE share_id = new_share_id) THEN
      -- Check if share_id already exists in public_shares table
      IF NOT EXISTS (SELECT 1 FROM public.public_shares WHERE share_id = new_share_id) THEN
        RETURN new_share_id;
      END IF;
    END IF;
    
    -- Prevent infinite loop
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique share ID after 100 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create a public share
CREATE OR REPLACE FUNCTION create_public_share(
  p_document_id uuid,
  p_share_scope text DEFAULT 'document'
)
RETURNS json AS $$
DECLARE
  new_share_id uuid;
  share_record record;
  document_record record;
BEGIN
  -- Check if document exists
  SELECT * INTO document_record FROM public.documents WHERE id = p_document_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  -- Check if document is already shared
  IF document_record.is_shared THEN
    RAISE EXCEPTION 'Document is already shared';
  END IF;
  
  -- Generate unique share ID
  new_share_id := generate_unique_share_id();
  
  -- Update document with sharing info
  UPDATE public.documents 
  SET is_shared = true,
      share_id = new_share_id,
      shared_at = now(),
      share_scope = p_share_scope
  WHERE id = p_document_id;
  
  -- Create share record
  INSERT INTO public.public_shares (document_id, share_id, share_scope)
  VALUES (p_document_id, new_share_id, p_share_scope)
  RETURNING * INTO share_record;
  
  RETURN json_build_object(
    'share_id', new_share_id,
    'share_scope', p_share_scope,
    'shared_at', share_record.created_at
  );
END;
$$ LANGUAGE plpgsql;

-- Function to revoke a public share
CREATE OR REPLACE FUNCTION revoke_public_share(p_document_id uuid)
RETURNS boolean AS $$
DECLARE
  document_record record;
BEGIN
  -- Check if document exists and is shared
  SELECT * INTO document_record FROM public.documents WHERE id = p_document_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  IF NOT document_record.is_shared THEN
    RAISE EXCEPTION 'Document is not shared';
  END IF;
  
  -- Remove sharing info from document
  UPDATE public.documents 
  SET is_shared = false,
      share_id = NULL,
      shared_at = NULL,
      share_scope = 'document'
  WHERE id = p_document_id;
  
  -- Delete share record
  DELETE FROM public.public_shares WHERE document_id = p_document_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get shared document by share ID
CREATE OR REPLACE FUNCTION get_shared_document(p_share_id uuid)
RETURNS json AS $$
DECLARE
  document_record record;
  share_record record;
  children_docs jsonb;
BEGIN
  -- Get share record
  SELECT * INTO share_record FROM public.public_shares WHERE share_id = p_share_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Share not found or expired';
  END IF;
  
  -- Check if share has expired
  IF share_record.expires_at IS NOT NULL AND share_record.expires_at < now() THEN
    RAISE EXCEPTION 'Share has expired';
  END IF;
  
  -- Get document
  SELECT * INTO document_record FROM public.documents WHERE id = share_record.document_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  -- Update view count and last viewed
  UPDATE public.public_shares 
  SET view_count = view_count + 1,
      last_viewed_at = now()
  WHERE id = share_record.id;
  
  -- If sharing a folder, get all children documents (including nested ones)
  IF share_record.share_scope = 'folder' THEN
    WITH RECURSIVE folder_tree AS (
      -- Get direct children
      SELECT d.*, 1 as level
      FROM public.documents d
      WHERE d.parent_id = document_record.id
      
      UNION ALL
      
      -- Get nested children
      SELECT d.*, ft.level + 1
      FROM public.documents d
      INNER JOIN folder_tree ft ON d.parent_id = ft.id
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'content', d.content,
        'type', d.type,
        'parent_id', d.parent_id,
        'order_index', d.order_index,
        'created_at', d.created_at,
        'is_shared', d.is_shared,
        'share_id', d.share_id,
        'shared_at', d.shared_at,
        'share_scope', d.share_scope
      )
    ) INTO children_docs
    FROM folder_tree d
    ORDER BY d.level, d.order_index;
  END IF;
  
  RETURN json_build_object(
    'document', document_record,
    'share', share_record,
    'children', COALESCE(children_docs, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get all shared documents for a user
CREATE OR REPLACE FUNCTION get_user_shared_documents(p_user_id uuid)
RETURNS json AS $$
DECLARE
  shared_docs jsonb;
BEGIN
  SELECT jsonb_agg(
    json_build_object(
      'document', d.*,
      'share', ps.*
    )
  ) INTO shared_docs
  FROM public.documents d
  JOIN public.public_shares ps ON d.id = ps.document_id
  JOIN public.user_rooms ur ON d.id = ur.room_id
  WHERE ur.user_id = p_user_id
  AND d.is_shared = true
  ORDER BY ps.created_at DESC;
  
  RETURN json_build_object('shared_documents', COALESCE(shared_docs, '[]'::jsonb));
END;
$$ LANGUAGE plpgsql;
