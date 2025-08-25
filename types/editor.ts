// Editor-specific types for block-based content

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: BlockMetadata;
  listIndex?: number; // For numbered lists
  parentListId?: string; // For nested lists
  checked?: boolean; // For todo lists
  orderIndex?: number; // For drag and drop ordering
}

export type BlockType = 
  | 'text'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'bulleted-list'
  | 'numbered-list'
  | 'todo-list'
  | 'quote'
  | 'code-block'
  | 'divider'
  | 'table'
  | 'image'
  | 'im'
  | 'video';

export interface BlockMetadata {
  language?: string; // For code blocks
  url?: string; // For images/videos
  alt?: string; // For images
  columns?: number; // For tables
  rows?: number; // For tables
  mode?: 'upload' | 'external'; // For images: uploaded or external URL
  filePath?: string; // For uploaded images: storage path
  originalFilename?: string; // For uploaded images: original filename
  fileSize?: number; // For uploaded images: file size in bytes
  mimeType?: string; // For uploaded images: MIME type
  [key: string]: any; // Allow additional metadata
}

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  preview: React.ReactNode;
  action: (content: string) => { newContent: string; newCursorPosition: number };
}

export interface DocumentBlocks {
  blocks: Block[];
  version: number; // For future migrations
}

// Block action types
export interface BlockAction {
  type: 'change-type' | 'duplicate' | 'delete' | 'add-below' | 'add-above';
  blockId: string;
  newType?: BlockType;
  newContent?: string;
}

// Editor state
export interface EditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
}

