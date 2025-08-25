"use client";

import { RichBlock, BlockType } from "@/types/editor";
import RichTextBlock from "./RichTextBlock";
import ToggleListBlock from "./blocks/ToggleListBlock";
import CalloutBlock from "./blocks/CalloutBlock";
import TableBlock from "./blocks/TableBlock";

interface BlockRendererProps {
  block: RichBlock;
  isSelected: boolean;
  onContentChange: (blockId: string, content: string) => void;
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
  onDragStart: (e: React.DragEvent, block: RichBlock) => void;
}

export default function BlockRenderer({
  block,
  isSelected,
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
    case BlockType.TOGGLE_LIST:
      return (
        <ToggleListBlock
          {...commonProps}
          onAddChild={onAddChild}
        />
      );

    case BlockType.CALLOUT:
      return (
        <CalloutBlock
          {...commonProps}
          onIconChange={onIconChange}
        />
      );

    case BlockType.TABLE:
      return (
        <TableBlock
          {...commonProps}
          onTableStructureChange={onTableStructureChange}
        />
      );

    case BlockType.DIVIDER:
      return (
        <div className="border-t border-gray-600 my-4" />
      );

    case BlockType.IMAGE:
      return (
        <div className="image-block bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-4xl mb-2">🖼️</div>
          <RichTextBlock
            {...commonProps}
            placeholder="Image description or URL"
          />
        </div>
      );

    case BlockType.VIDEO:
      return (
        <div className="video-block bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-4xl mb-2">🎥</div>
          <RichTextBlock
            {...commonProps}
            placeholder="Video description or URL"
          />
        </div>
      );

    case BlockType.BOOKMARK:
      return (
        <div className="bookmark-block bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔖</div>
            <div className="flex-1">
              <RichTextBlock
                {...commonProps}
                placeholder="Bookmark URL"
              />
            </div>
          </div>
        </div>
      );

    case BlockType.COLUMNS:
      return (
        <div className="columns-block grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <RichTextBlock
              {...commonProps}
              placeholder="Column 1 content"
            />
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <RichTextBlock
              {...commonProps}
              placeholder="Column 2 content"
            />
          </div>
        </div>
      );

    case BlockType.MATH:
    case BlockType.EQUATION:
      return (
        <div className="math-block bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">∑</div>
          <RichTextBlock
            {...commonProps}
            placeholder="Mathematical equation"
          />
        </div>
      );

    case BlockType.MENTION:
      return (
        <div className="mention-block">
          <RichTextBlock
            {...commonProps}
            placeholder="@username"
          />
        </div>
      );

    case BlockType.PAGE_REFERENCE:
      return (
        <div className="page-reference-block bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📄</div>
            <div className="flex-1">
              <RichTextBlock
                {...commonProps}
                placeholder="Page title or ID"
              />
            </div>
          </div>
        </div>
      );

    case BlockType.DATABASE_REFERENCE:
      return (
        <div className="database-reference-block bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🗄️</div>
            <div className="flex-1">
              <RichTextBlock
                {...commonProps}
                placeholder="Database name or ID"
              />
            </div>
          </div>
        </div>
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

