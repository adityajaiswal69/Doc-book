-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add content column to existing documents table (if it doesn't exist)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';

-- Create user_rooms table for permissions
CREATE TABLE IF NOT EXISTS user_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_rooms_user_id ON user_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rooms_room_id ON user_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at);

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
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
