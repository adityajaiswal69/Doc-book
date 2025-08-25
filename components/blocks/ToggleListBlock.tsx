"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { RichBlock, BlockType } from "@/types/editor";
import RichTextBlock from "../RichTextBlock";

interface ToggleListBlockProps {
  block: RichBlock;
  isSelected: boolean;
  onContentChange: (blockId: string, content: string) => void;
  onSelectionChange: (selection: any) => void;
  onKeyDown: (e: React.KeyboardEvent, blockId: string) => void;
  onFocus: (blockId: string) => void;
  onBlur: () => void;
  onAddChild: (parentId: string) => void;
}

export default function ToggleListBlock({
  block,
  isSelected,
  onContentChange,
  onSelectionChange,
  onKeyDown,
  onFocus,
  onBlur,
  onAddChild
}: ToggleListBlockProps) {
  const [isExpanded, setIsExpanded] = useState(!block.metadata.collapsed);
  const hasChildren = block.children && block.children.length > 0;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddChild = () => {
    onAddChild(block.id);
    setIsExpanded(true); // Auto-expand when adding child
  };

  return (
    <div className="toggle-list-block">
      {/* Toggle Header */}
      <div className="flex items-start gap-2 group">
        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className={`flex-shrink-0 mt-1 p-1 rounded hover:bg-gray-800/50 transition-colors ${
            hasChildren ? 'cursor-pointer' : 'cursor-default opacity-50'
          }`}
          disabled={!hasChildren}
          title={hasChildren ? 'Toggle content' : 'No content to toggle'}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-blue-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-blue-400" />
            )
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <RichTextBlock
            block={block}
            isSelected={isSelected}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Toggle item"
          />
        </div>

        {/* Add Child Button - visible on hover */}
        <button
          onClick={handleAddChild}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-800/50 text-gray-400 hover:text-white"
          title="Add child item"
        >
          <ChevronRight className="h-4 w-4 rotate-90" />
        </button>
      </div>

      {/* Toggle Content */}
      {isExpanded && hasChildren && (
        <div className="ml-6 mt-2 space-y-1 border-l border-gray-700 pl-4">
          {block.children?.map((child) => (
            <div key={child.id} className="relative group/child">
              {/* Render child blocks recursively */}
              {child.type === BlockType.TOGGLE_LIST ? (
                <ToggleListBlock
                  block={child}
                  isSelected={false}
                  onContentChange={onContentChange}
                  onSelectionChange={onSelectionChange}
                  onKeyDown={onKeyDown}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  onAddChild={onAddChild}
                />
              ) : (
                <RichTextBlock
                  block={child}
                  isSelected={false}
                  onContentChange={onContentChange}
                  onSelectionChange={onSelectionChange}
                  onKeyDown={onKeyDown}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {isExpanded && !hasChildren && (
        <div className="ml-6 mt-2 pl-4">
          <div className="text-sm text-gray-500 italic">
            No content yet. Click the + button to add items.
          </div>
        </div>
      )}
    </div>
  );
}

