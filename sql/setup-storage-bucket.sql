-- Setup Supabase Storage Bucket for Images
-- This script creates the necessary storage bucket and policies for image uploads

-- Step 1: Create the images storage bucket
-- Note: Storage buckets cannot be created via SQL, this must be done via Supabase Dashboard or API
-- Go to: Project Dashboard > Storage > Create bucket
-- Bucket name: images
-- Public: true (for public access to images)
-- File size limit: 50MB (or as needed)
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml, image/bmp

-- Step 2: Create storage policies for the images bucket
-- Policy to allow authenticated users to upload images
INSERT INTO storage.policies (name, bucket_id, definition, check)
VALUES (
  'Allow authenticated users to upload images',
  'images',
  'bucket_id = ''images'' AND auth.uid() IS NOT NULL',
  'bucket_id = ''images'' AND auth.uid() IS NOT NULL'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Policy to allow public read access to images
INSERT INTO storage.policies (name, bucket_id, definition, check)
VALUES (
  'Allow public read access to images',
  'images', 
  'bucket_id = ''images''',
  NULL
)
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Policy to allow users to update their own images
INSERT INTO storage.policies (name, bucket_id, definition, check)
VALUES (
  'Allow users to update their own images',
  'images',
  'bucket_id = ''images'' AND auth.uid() IS NOT NULL',
  'bucket_id = ''images'' AND auth.uid() IS NOT NULL'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Policy to allow users to delete their own images  
INSERT INTO storage.policies (name, bucket_id, definition, check)
VALUES (
  'Allow users to delete their own images',
  'images',
  'bucket_id = ''images'' AND auth.uid() IS NOT NULL',
  'bucket_id = ''images'' AND auth.uid() IS NOT NULL'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Alternative approach: Create RLS policies via SQL (preferred method)
-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert images
CREATE POLICY "Allow authenticated uploads for images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.uid() IS NOT NULL
);

-- Policy: Allow public read access to images  
CREATE POLICY "Allow public access for images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Policy: Allow users to update images for documents they own
CREATE POLICY "Allow authenticated updates for owned images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' 
  AND auth.uid() IS NOT NULL
  -- Additional check: user must own the document
  AND EXISTS (
    SELECT 1 FROM storage_images si 
    JOIN user_rooms ur ON si.document_id = ur.room_id::uuid
    WHERE si.file_path = storage.objects.name 
    AND ur.user_id = auth.uid()::text 
    AND ur.role = 'owner'
  )
);

-- Policy: Allow users to delete images for documents they own
CREATE POLICY "Allow authenticated deletes for owned images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.uid() IS NOT NULL
  -- Additional check: user must own the document
  AND EXISTS (
    SELECT 1 FROM storage_images si 
    JOIN user_rooms ur ON si.document_id = ur.room_id::uuid
    WHERE si.file_path = storage.objects.name 
    AND ur.user_id = auth.uid()::text 
    AND ur.role = 'owner'
  )
);

-- Create function to check if images bucket exists
CREATE OR REPLACE FUNCTION check_images_bucket_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'images'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_images_bucket_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION check_images_bucket_exists() TO anon;
