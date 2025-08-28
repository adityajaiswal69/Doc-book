"use client";

import { useState } from "react";
import React from "react";
import { Block } from "@/types/editor";
import RichTextBlock from "../RichTextBlock";

interface CalloutBlockProps {
  block: Block;
  isSelected: boolean;
  onContentChange: (blockId: string, content: string) => void;
  onSelectionChange: (selection: unknown) => void;
  onKeyDown: (e: React.KeyboardEvent, blockId: string) => void;
  onFocus: (blockId: string) => void;
  onBlur: () => void;
  onIconChange: (blockId: string, icon: string) => void;
}

export default function CalloutBlock({
  block,
  isSelected,
  onContentChange,
  onSelectionChange,
  onKeyDown,
  onFocus,
  onBlur,
  onIconChange
}: CalloutBlockProps) {
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Default icon if none is set
  const currentIcon = block.metadata?.icon || '💡';

  // Icon options for callouts
  const iconOptions = [
    { icon: '💡', label: 'Lightbulb', emoji: '💡' },
    { icon: 'ℹ️', label: 'Info', emoji: 'ℹ️' },
    { icon: '⚠️', label: 'Warning', emoji: '⚠️' },
    { icon: '✅', label: 'Success', emoji: '✅' },
    { icon: '❌', label: 'Error', emoji: '❌' },
    { icon: '❓', label: 'Question', emoji: '❓' },
    { icon: '🔥', label: 'Hot', emoji: '🔥' },
    { icon: '⭐', label: 'Star', emoji: '⭐' },
    { icon: '🚀', label: 'Rocket', emoji: '🚀' },
    { icon: '💭', label: 'Thought', emoji: '💭' },
    { icon: '📝', label: 'Note', emoji: '📝' },
    { icon: '🎯', label: 'Target', emoji: '🎯' }
  ];

  // Get callout styles based on icon
  const getCalloutStyles = () => {
    const baseStyles = "rounded-lg p-4 border";
    
    switch (currentIcon) {
      case '💡':
        return `${baseStyles} bg-blue-900/20 border-blue-700/30 text-blue-100`;
      case 'ℹ️':
        return `${baseStyles} bg-blue-900/20 border-blue-700/30 text-blue-100`;
      case '⚠️':
        return `${baseStyles} bg-yellow-900/20 border-yellow-700/30 text-yellow-100`;
      case '✅':
        return `${baseStyles} bg-green-900/20 border-green-700/30 text-green-100`;
      case '❌':
        return `${baseStyles} bg-red-900/20 border-red-700/30 text-red-100`;
      case '❓':
        return `${baseStyles} bg-purple-900/20 border-purple-700/30 text-purple-100`;
      case '🔥':
        return `${baseStyles} bg-orange-900/20 border-orange-700/30 text-orange-100`;
      case '⭐':
        return `${baseStyles} bg-yellow-900/20 border-yellow-700/30 text-yellow-100`;
      case '🚀':
        return `${baseStyles} bg-purple-900/20 border-purple-700/30 text-purple-100`;
      case '💭':
        return `${baseStyles} bg-gray-900/20 border-gray-700/30 text-gray-100`;
      case '📝':
        return `${baseStyles} bg-green-900/20 border-green-700/30 text-green-100`;
      case '🎯':
        return `${baseStyles} bg-red-900/20 border-red-700/30 text-red-100`;
      default:
        return `${baseStyles} bg-gray-900/20 border-gray-700/30 text-gray-100`;
    }
  };

  const handleIconSelect = (icon: string) => {
    onIconChange(block.id, icon);
    setShowIconPicker(false);
  };

  return (
    <div className={`callout-block ${getCalloutStyles()} ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="text-2xl hover:scale-110 transition-transform duration-200 cursor-pointer"
            title="Change icon"
          >
            {currentIcon}
          </button>

          {/* Icon Picker */}
          {showIconPicker && (
            <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg p-2 shadow-xl z-50 min-w-[200px]">
              <div className="text-xs font-medium text-gray-400 mb-2 px-2">CHOOSE ICON</div>
              <div className="grid grid-cols-4 gap-1">
                {iconOptions.map((option) => (
                  <button
                    key={option.icon}
                    onClick={() => handleIconSelect(option.icon)}
                    className={`w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center text-lg transition-colors ${
                      currentIcon === option.icon ? 'bg-blue-600/20 ring-2 ring-blue-500' : ''
                    }`}
                    title={option.label}
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700">
                <button
                  onClick={() => setShowIconPicker(false)}
                  className="w-full text-xs text-gray-400 hover:text-white text-center py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

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
            placeholder="Callout text"
          />
        </div>
      </div>

      {/* Click outside to close icon picker */}
      {showIconPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowIconPicker(false)}
        />
      )}
    </div>
  );
}

