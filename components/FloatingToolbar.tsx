"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link, 
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Selection, FormattingState } from "@/types/editor";

interface FloatingToolbarProps {
  selection: Selection | null;
  formatting: FormattingState;
  onFormatChange: (format: string, value: any) => void;
  onClose: () => void;
}

export default function FloatingToolbar({
  selection,
  formatting,
  onFormatChange,
  onClose
}: FloatingToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState(formatting.link || '');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate toolbar position based on selection
  useEffect(() => {
    if (!selection) return;

    const updatePosition = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (rect.width === 0 || rect.height === 0) return;

      const toolbarHeight = 48; // Approximate toolbar height
      const toolbarWidth = 320; // Approximate toolbar width
      
      let top = rect.top - toolbarHeight - 10;
      let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);

      // Ensure toolbar stays within viewport
      if (top < 10) {
        top = rect.bottom + 10;
      }
      if (left < 10) {
        left = 10;
      }
      if (left + toolbarWidth > window.innerWidth - 10) {
        left = window.innerWidth - toolbarWidth - 10;
      }

      setPosition({ top, left });
    };

    // Update position immediately and on scroll/resize
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [selection]);

  // Handle link submission
  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      onFormatChange('link', linkUrl.trim());
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  // Handle link removal
  const handleLinkRemove = () => {
    onFormatChange('link', null);
    setShowLinkInput(false);
    setLinkUrl('');
  };

  // Close toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!selection) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateY(-50%)'
      }}
    >
      <div className="flex items-center gap-1 p-1">
        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${formatting.isBold ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange('isBold', !formatting.isBold)}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${formatting.isItalic ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange('isItalic', !formatting.isItalic)}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${formatting.isUnderlined ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange('isUnderlined', !formatting.isUnderlined)}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${formatting.isStrikethrough ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange('isStrikethrough', !formatting.isStrikethrough)}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${formatting.isCode ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange('isCode', !formatting.isCode)}
          title="Code (Ctrl+Shift+K)"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Text Alignment */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${formatting.textAlign === 'left' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange('textAlign', 'left')}
          title="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${formatting.textAlign === 'center' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange('textAlign', 'center')}
          title="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${formatting.textAlign === 'right' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange('textAlign', 'right')}
          title="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Text Color */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          onClick={() => onFormatChange('color', formatting.color === 'text-blue-500' ? null : 'text-blue-500')}
          title="Text color"
        >
          <Palette className="h-4 w-4" />
        </Button>

        {/* Link */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${formatting.link ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setShowLinkInput(!showLinkInput)}
          title="Add link (Ctrl+K)"
        >
          <Link className="h-4 w-4" />
        </Button>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          onClick={onClose}
          title="Close toolbar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="p-2 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="h-7 text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLinkSubmit();
                } else if (e.key === 'Escape') {
                  setShowLinkInput(false);
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleLinkSubmit}
              className="h-7 px-2 text-xs"
            >
              Add
            </Button>
            {formatting.link && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLinkRemove}
                className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

