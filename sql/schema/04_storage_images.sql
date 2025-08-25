-- Storage Images Schema for Uploadable Image Block Feature
-- This schema handles both uploaded images and external URLs

-- Create storage_images table to track all images
CREATE TABLE IF NOT EXISTS public.storage_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  block_id text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('upload', 'external')),
  original_filename text,
  file_path text,
  file_size bigint,
  mime_type text,
  url text NOT NULL,
  alt_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  
  CONSTRAINT storage_images_pkey PRIMARY KEY (id),
  CONSTRAINT storage_images_document_id_fkey FOREIGN KEY (document_id) 
    REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT storage_images_document_block_unique UNIQUE (document_id, block_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_images_document_id ON public.storage_images(document_id);
CREATE INDEX IF NOT EXISTS idx_storage_images_block_id ON public.storage_images(block_id);
CREATE INDEX IF NOT EXISTS idx_storage_images_mode ON public.storage_images(mode);
CREATE INDEX IF NOT EXISTS idx_storage_images_deleted_at ON public.storage_images(deleted_at);
CREATE INDEX IF NOT EXISTS idx_storage_images_file_path ON public.storage_images(file_path);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_storage_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_storage_images_updated_at
  BEFORE UPDATE ON storage_images
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_images_updated_at();

-- Function to create storage folder path for a document
CREATE OR REPLACE FUNCTION create_document_storage_path(document_title text, block_id text)
RETURNS text AS $$
BEGIN
  -- Sanitize document title for use as folder name
  -- Remove special characters and replace spaces with hyphens
  RETURN lower(
    regexp_replace(
      regexp_replace(document_title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  ) || '/' || block_id || '.image/';
END;
$$ LANGUAGE plpgsql;

-- Function to handle image block creation/update
CREATE OR REPLACE FUNCTION handle_image_block(
  p_document_id uuid,
  p_block_id text,
  p_mode text,
  p_url text DEFAULT NULL,
  p_original_filename text DEFAULT NULL,
  p_file_size bigint DEFAULT NULL,
  p_mime_type text DEFAULT NULL,
  p_alt_text text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_document_title text;
  v_file_path text;
  v_existing_image storage_images%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Get document title for storage path
  SELECT title INTO v_document_title 
  FROM documents 
  WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found: %', p_document_id;
  END IF;
  
  -- Check if image already exists for this block
  SELECT * INTO v_existing_image 
  FROM storage_images 
  WHERE document_id = p_document_id AND block_id = p_block_id;
  
  -- If updating an uploaded image, delete the old file from storage
  IF v_existing_image IS NOT NULL AND v_existing_image.mode = 'upload' AND p_mode = 'upload' THEN
    -- Mark old file for deletion (actual file deletion will be handled by application)
    UPDATE storage_images 
    SET deleted_at = now() 
    WHERE id = v_existing_image.id;
  END IF;
  
  -- Create file path for uploaded images
  IF p_mode = 'upload' THEN
    v_file_path := create_document_storage_path(v_document_title, p_block_id);
  ELSE
    v_file_path := NULL;
  END IF;
  
  -- Insert or update the image record
  INSERT INTO storage_images (
    document_id, 
    block_id, 
    mode, 
    original_filename, 
    file_path, 
    file_size, 
    mime_type, 
    url, 
    alt_text
  ) VALUES (
    p_document_id,
    p_block_id,
    p_mode,
    p_original_filename,
    v_file_path,
    p_file_size,
    p_mime_type,
    p_url,
    p_alt_text
  )
  ON CONFLICT (document_id, block_id) 
  DO UPDATE SET
    mode = EXCLUDED.mode,
    original_filename = EXCLUDED.original_filename,
    file_path = EXCLUDED.file_path,
    file_size = EXCLUDED.file_size,
    mime_type = EXCLUDED.mime_type,
    url = EXCLUDED.url,
    alt_text = EXCLUDED.alt_text,
    updated_at = now(),
    deleted_at = NULL
  RETURNING jsonb_build_object(
    'id', id,
    'document_id', document_id,
    'block_id', block_id,
    'mode', mode,
    'url', url,
    'file_path', file_path,
    'alt_text', alt_text
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to delete image block and clean up storage
CREATE OR REPLACE FUNCTION delete_image_block(p_document_id uuid, p_block_id text)
RETURNS boolean AS $$
DECLARE
  v_image storage_images%ROWTYPE;
BEGIN
  -- Get the image record
  SELECT * INTO v_image 
  FROM storage_images 
  WHERE document_id = p_document_id AND block_id = p_block_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Mark as deleted (actual file deletion will be handled by application)
  UPDATE storage_images 
  SET deleted_at = now() 
  WHERE id = v_image.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to handle document title changes and update storage paths
CREATE OR REPLACE FUNCTION update_document_storage_paths(p_document_id uuid, p_new_title text)
RETURNS void AS $$
DECLARE
  v_image storage_images%ROWTYPE;
  v_new_file_path text;
BEGIN
  -- Update all uploaded images for this document
  FOR v_image IN 
    SELECT * FROM storage_images 
    WHERE document_id = p_document_id AND mode = 'upload' AND deleted_at IS NULL
  LOOP
    v_new_file_path := create_document_storage_path(p_new_title, v_image.block_id);
    
    UPDATE storage_images 
    SET file_path = v_new_file_path, updated_at = now()
    WHERE id = v_image.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get all images for a document
CREATE OR REPLACE FUNCTION get_document_images(p_document_id uuid)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'block_id', block_id,
        'mode', mode,
        'url', url,
        'file_path', file_path,
        'alt_text', alt_text,
        'created_at', created_at
      )
    )
    FROM storage_images 
    WHERE document_id = p_document_id AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get orphaned images (images without corresponding blocks)
CREATE OR REPLACE FUNCTION get_orphaned_images()
RETURNS TABLE (
  id uuid,
  document_id uuid,
  block_id text,
  file_path text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT si.id, si.document_id, si.block_id, si.file_path, si.created_at
  FROM storage_images si
  LEFT JOIN documents d ON d.id = si.document_id
  WHERE si.deleted_at IS NULL 
    AND si.mode = 'upload'
    AND (d.id IS NULL OR d.deleted_at IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE storage_images 
  SET deleted_at = now() 
  WHERE id IN (
    SELECT si.id
    FROM storage_images si
    LEFT JOIN documents d ON d.id = si.document_id
    WHERE si.deleted_at IS NULL 
      AND si.mode = 'upload'
      AND (d.id IS NULL OR d.deleted_at IS NOT NULL)
  );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update storage paths when document title changes
CREATE OR REPLACE FUNCTION trigger_update_storage_paths()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if title actually changed
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    PERFORM update_document_storage_paths(NEW.id, NEW.title);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_storage_paths ON documents;
CREATE TRIGGER trigger_update_storage_paths
  AFTER UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_storage_paths();

-- Function to validate image URL
CREATE OR REPLACE FUNCTION validate_image_url(p_url text)
RETURNS boolean AS $$
BEGIN
  -- Basic URL validation for images
  RETURN p_url ~ '^https?://[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?[^\s]*)?$';
END;
$$ LANGUAGE plpgsql;

-- Function to get storage statistics
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'total_images', COUNT(*),
      'uploaded_images', COUNT(*) FILTER (WHERE mode = 'upload'),
      'external_images', COUNT(*) FILTER (WHERE mode = 'external'),
      'total_size', COALESCE(SUM(file_size), 0),
      'deleted_images', COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)
    )
    FROM storage_images
  );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON storage_images TO authenticated;

-- Create RLS policies
ALTER TABLE storage_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access images for documents they have access to
CREATE POLICY "Users can access images for their documents" ON storage_images
  FOR ALL USING (
    document_id IN (
      SELECT room_id FROM user_rooms WHERE user_id = auth.uid()::text
    )
  );

-- Policy: Users can insert images for documents they own
CREATE POLICY "Users can insert images for their documents" ON storage_images
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT room_id FROM user_rooms WHERE user_id = auth.uid()::text AND role = 'owner'
    )
  );

-- Policy: Users can update images for documents they own
CREATE POLICY "Users can update images for their documents" ON storage_images
  FOR UPDATE USING (
    document_id IN (
      SELECT room_id FROM user_rooms WHERE user_id = auth.uid()::text AND role = 'owner'
    )
  );

-- Policy: Users can delete images for documents they own
CREATE POLICY "Users can delete images for their documents" ON storage_images
  FOR DELETE USING (
    document_id IN (
      SELECT room_id FROM user_rooms WHERE user_id = auth.uid()::text AND role = 'owner'
    )
  );
