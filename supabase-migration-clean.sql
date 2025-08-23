-- Clean migration for essential blocks only (no AI features)
-- This file will run successfully and create a working slash command system

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS user_rooms CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Create documents table with essential structure
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_rooms table for permissions
CREATE TABLE user_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- Create essential indexes for performance
CREATE INDEX idx_user_rooms_user_id ON user_rooms(user_id);
CREATE INDEX idx_user_rooms_room_id ON user_rooms(room_id);
CREATE INDEX idx_documents_updated_at ON documents(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for documents table
CREATE POLICY "Users can view documents they have access to" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_rooms 
      WHERE user_rooms.room_id = documents.id 
      AND user_rooms.user_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can update their documents" ON documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_rooms 
      WHERE user_rooms.room_id = documents.id 
      AND user_rooms.user_id = auth.uid()
      AND user_rooms.role = 'owner'
    )
  );

CREATE POLICY "Document owners can delete their documents" ON documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_rooms 
      WHERE user_rooms.room_id = documents.id 
      AND user_rooms.user_id = auth.uid()
      AND user_rooms.role = 'owner'
    )
  );

-- Create policies for user_rooms table
CREATE POLICY "Users can view their own room permissions" ON user_rooms
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own room permissions" ON user_rooms
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Document owners can update room permissions" ON user_rooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_rooms ur
      WHERE ur.room_id = user_rooms.room_id 
      AND ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
  );

CREATE POLICY "Document owners can delete room permissions" ON user_rooms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_rooms ur
      WHERE ur.room_id = user_rooms.room_id 
      AND ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create simple function for content updates (essential blocks only)
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

-- Create basic indexes for essential functionality
CREATE INDEX idx_documents_content_length ON documents(LENGTH(content));
CREATE INDEX idx_documents_title_length ON documents(LENGTH(title));

-- Insert sample data for testing (optional)
INSERT INTO documents (title, content) VALUES 
('Welcome Document', '# Welcome to Your Document Editor

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

Enjoy writing!');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON user_rooms TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_content_simple TO authenticated;
