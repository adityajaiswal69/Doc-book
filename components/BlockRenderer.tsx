"use client";

import { Block, BlockType } from "@/types/editor";
import RichTextBlock from "./RichTextBlock";
import TableBlock from "./blocks/TableBlock";
import ImageBlock from "./blocks/ImageBlock";
import VideoBlock from "./blocks/VideoBlock";

interface BlockRendererProps {
  block: Block;
  isSelected: boolean;
  documentId: string;
  onContentChange: (blockId: string, content: string, metadata?: any) => void;
  onSelectionChange: (selection: any) => void;
  onKeyDown: (e: React.KeyboardEvent, blockId: string) => void;
  onFocus: (blockId: string) => void;
  onBlur: () => void;
  onBlockTypeChange: (blockId: string, newType: BlockType) => void;
  onFormatChange: (blockId: string, format: string, value: any) => void;
  onDuplicate: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onAddComment: (blockId: string) => void;
  onAddChild: (parentId: string) => void;
  onIconChange: (blockId: string, icon: string) => void;
  onTableStructureChange: (blockId: string, rows: number, columns: number) => void;
  onDragStart: (e: React.DragEvent, block: Block) => void;
}

export default function BlockRenderer({
  block,
  isSelected,
  documentId,
  onContentChange,
  onSelectionChange,
  onKeyDown,
  onFocus,
  onBlur,
  onBlockTypeChange,
  onFormatChange,
  onDuplicate,
  onDelete,
  onAddComment,
  onAddChild,
  onIconChange,
  onTableStructureChange,
  onDragStart
}: BlockRendererProps) {
  // Common props for all blocks
  const commonProps = {
    block,
    isSelected,
    onContentChange,
    onSelectionChange,
    onKeyDown,
    onFocus,
    onBlur
  };

  // Render different block types
  switch (block.type) {
    case 'table':
      return (
        <TableBlock
          {...commonProps}
          onTableStructureChange={onTableStructureChange}
        />
      );

    case 'divider':
      return (
        <div className="border-t border-gray-600 my-4" />
      );

    case 'image':
    case 'im':
      return (
        <ImageBlock
          block={block}
          documentId={documentId}
          onContentChange={(blockId, content, metadata) => {
            onContentChange(blockId, content, metadata);
          }}
          onBlockDelete={(blockId) => {
            onDelete(blockId);
          }}
        />
      );

    case 'video':
      return (
        <VideoBlock
          block={block}
          documentId={documentId}
          onContentChange={(blockId, content, metadata) => {
            onContentChange(blockId, content, metadata);
          }}
          onBlockDelete={(blockId) => {
            onDelete(blockId);
          }}
        />
      );

    // Default case - render as rich text block
    default:
      return (
        <RichTextBlock
          {...commonProps}
        />
      );
  }
}

