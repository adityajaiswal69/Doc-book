// Enhanced block types for Notion-like editor
export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING_1 = 'heading-1',
  HEADING_2 = 'heading-2',
  HEADING_3 = 'heading-3',
  BULLETED_LIST = 'bulleted-list',
  NUMBERED_LIST = 'numbered-list',
  TOGGLE_LIST = 'toggle-list',
  TODO_LIST = 'todo-list',
  QUOTE = 'quote',
  CODE_BLOCK = 'code-block',
  CODE_INLINE = 'code-inline',
  DIVIDER = 'divider',
  TABLE = 'table',
  TABLE_ROW = 'table-row',
  TABLE_CELL = 'table-cell',
  IMAGE = 'image',
  VIDEO = 'video',
  EMBED = 'embed',
  BOOKMARK = 'bookmark',
  CALLOUT = 'callout',
  COLUMN = 'column',
  COLUMN_LIST = 'column-list',
  MATH = 'math',
  EQUATION = 'equation',
  MENTION = 'mention',
  PAGE_REFERENCE = 'page-reference',
  DATABASE_REFERENCE = 'database-reference'
}

export interface BlockMetadata {
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderlined?: boolean;
  isStrikethrough?: boolean;
  isCode?: boolean;
  link?: string;
  mentions?: string[];
  icon?: string;
  language?: string; // For code blocks
  rows?: number; // For tables
  columns?: number; // For tables
  collapsed?: boolean; // For toggle lists
  checked?: boolean; // For todo lists
  url?: string; // For bookmarks and embeds
  title?: string; // For bookmarks
  description?: string; // For bookmarks
  thumbnail?: string; // For bookmarks
  pageId?: string; // For page references
  databaseId?: string; // For database references
}

export interface RichBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata: BlockMetadata;
  children?: RichBlock[];
  parentId?: string;
  order: number;
  isCollapsed?: boolean;
  isSelected?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  preview: React.ReactNode;
  category: string;
  action: (content: string) => { newContent: string; newCursorPosition: number };
}

export interface Selection {
  start: number;
  end: number;
  blockId: string;
}

export interface FormattingState {
  isBold: boolean;
  isItalic: boolean;
  isUnderlined: boolean;
  isStrikethrough: boolean;
  isCode: boolean;
  link: string | null;
  color: string | null;
  backgroundColor: string | null;
}

