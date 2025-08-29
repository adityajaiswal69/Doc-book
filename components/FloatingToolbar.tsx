"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, Strikethrough, Code, Link, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Block } from "@/types/editor";

interface FloatingToolbarProps {
  block: Block;
  onFormatChange: (blockId: string, format: string, value: unknown) => void;
}

export default function FloatingToolbar({ block, onFormatChange }: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const toolbar = toolbarRef.current;
      
      if (!toolbar || !selection) return;

      const selectedText = selection.toString().trim();
      
      if (selectedText.length > 0 && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Check if selection is within the current block or any textarea with our block id
        const blockElement = document.querySelector(`textarea[data-block-id="${block.id}"]`) || 
                           document.querySelector(`[data-block-id="${block.id}"]`);
        
        let isInCurrentBlock = false;
        if (blockElement) {
          // Check if the selection is within this specific block
          const ancestor = range.commonAncestorContainer;
          isInCurrentBlock = blockElement.contains(ancestor) || blockElement === ancestor;
        }
        
        if (isInCurrentBlock && rect.width > 0 && rect.height > 0) {
          // Show toolbar after a small delay to ensure it renders properly
          setTimeout(() => {
            const toolbarRect = toolbar.getBoundingClientRect();
            const x = rect.left + (rect.width / 2) - (toolbarRect.width / 2);
            const y = rect.top - toolbarRect.height - 12;
            
            // Ensure toolbar stays within viewport
            const finalX = Math.max(8, Math.min(x, window.innerWidth - toolbarRect.width - 8));
            const finalY = Math.max(8, y);
            
            toolbar.style.left = `${finalX}px`;
            toolbar.style.top = `${finalY}px`;
            setIsVisible(true);
          }, 50);
        } else {
          setIsVisible(false);
        }
      } else {
        setIsVisible(false);
      }
    };

    const handleMouseUp = () => {
      // Delay to allow selection to complete
      setTimeout(() => {
        handleSelectionChange();
      }, 100);
    };

    const handleKeyUp = () => {
      // Handle keyboard selection
      setTimeout(() => {
        handleSelectionChange();
      }, 50);
    };

    // Initial check
    handleSelectionChange();

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [block.id]);

  const applyFormat = (format: string, value?: unknown) => {
    // Apply formatting and maintain selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      onFormatChange(block.id, format, value !== undefined ? value : !block.metadata?.[format]);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed bg-gray-900 border border-gray-700 rounded-lg p-1 shadow-2xl z-[90] backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
    >
      <div className="flex items-center gap-0.5">
        {/* Bold */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${block.metadata?.isBold ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => applyFormat('isBold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3 w-3" />
        </Button>

        {/* Italic */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${block.metadata?.isItalic ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => applyFormat('isItalic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3 w-3" />
        </Button>

        {/* Underline */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${block.metadata?.isUnderlined ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => applyFormat('isUnderlined')}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-3 w-3" />
        </Button>

        {/* Strikethrough */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${block.metadata?.isStrikethrough ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => applyFormat('isStrikethrough')}
          title="Strikethrough"
        >
          <Strikethrough className="h-3 w-3" />
        </Button>

        {/* Code */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${block.metadata?.isCode ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => applyFormat('isCode')}
          title="Code (Ctrl+Shift+K)"
        >
          <Code className="h-3 w-3" />
        </Button>

        <div className="w-px h-4 bg-gray-600 mx-1" />

        {/* Link */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${block.metadata?.link ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => {
            const url = prompt('Enter URL:', block.metadata?.link || '');
            if (url !== null) {
              applyFormat('link', url);
            }
          }}
          title="Add link (Ctrl+K)"
        >
          <Link className="h-3 w-3" />
        </Button>

        {/* Color picker could go here */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 hover:text-white"
          title="Text color"
        >
          <Palette className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}