-- Migration to add hierarchical structure support to documents table
-- This migration adds type, parent_id, and order_index fields

-- Add new columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'document' CHECK (type IN ('document', 'folder')),
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES documents(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create index for better performance on hierarchical queries
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_order_index ON documents(order_index);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- Update existing documents to have the new structure
-- Set all existing documents to type 'document' and order_index based on creation time
UPDATE documents 
SET 
  type = 'document',
  order_index = EXTRACT(EPOCH FROM created_at)::INTEGER
WHERE type IS NULL;

-- Ensure all documents have a valid type
UPDATE documents 
SET type = 'document' 
WHERE type NOT IN ('document', 'folder');

-- Set order_index for documents that might not have it
UPDATE documents 
SET order_index = EXTRACT(EPOCH FROM created_at)::INTEGER
WHERE order_index IS NULL;

-- Make the new columns NOT NULL after setting default values
ALTER TABLE documents 
ALTER COLUMN type SET NOT NULL,
ALTER COLUMN order_index SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN documents.type IS 'Type of document: document or folder';
COMMENT ON COLUMN documents.parent_id IS 'Reference to parent folder, NULL for root level';
COMMENT ON COLUMN documents.order_index IS 'Order index for sorting within parent folder';
