"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RichBlock, BlockType, Selection, FormattingState } from "@/types/editor";

interface RichTextBlockProps {
  block: RichBlock;
  isSelected: boolean;
  onContentChange: (blockId: string, content: string) => void;
  onSelectionChange: (selection: Selection | null) => void;
  onKeyDown: (e: React.KeyboardEvent, blockId: string) => void;
  onFocus: (blockId: string) => void;
  onBlur: () => void;
  placeholder?: string;
}

export default function RichTextBlock({
  block,
  isSelected,
  onContentChange,
  onSelectionChange,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder = "Type '/' for commands..."
}: RichTextBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lastContent, setLastContent] = useState(block.content);

  // Apply formatting to text content
  const applyFormatting = useCallback((text: string, metadata: any): string => {
    let formattedText = text;

    // Apply bold
    if (metadata.isBold) {
      formattedText = `<strong>${formattedText}</strong>`;
    }

    // Apply italic
    if (metadata.isItalic) {
      formattedText = `<em>${formattedText}</em>`;
    }

    // Apply underline
    if (metadata.isUnderlined) {
      formattedText = `<u>${formattedText}</u>`;
    }

    // Apply strikethrough
    if (metadata.isStrikethrough) {
      formattedText = `<s>${formattedText}</s>`;
    }

    // Apply code
    if (metadata.isCode) {
      formattedText = `<code>${formattedText}</code>`;
    }

    // Apply link
    if (metadata.link) {
      formattedText = `<a href="${metadata.link}" target="_blank" rel="noopener noreferrer">${formattedText}</a>`;
    }

    return formattedText;
  }, []);

  // Get text content without HTML tags
  const getTextContent = useCallback((element: HTMLElement): string => {
    return element.innerText || element.textContent || '';
  }, []);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (!contentRef.current) return;

    const newContent = getTextContent(contentRef.current);
    
    if (newContent !== lastContent) {
      setLastContent(newContent);
      onContentChange(block.id, newContent);
    }
  }, [block.id, lastContent, onContentChange, getTextContent]);

  // Handle selection changes
  const handleSelectionChange = useCallback(() => {
    if (!contentRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    // Check if selection is within this block
    if (contentRef.current.contains(startContainer) && contentRef.current.contains(endContainer)) {
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      onSelectionChange({
        blockId: block.id,
        start: startOffset,
        end: endOffset
      });
    }
  }, [block.id, onSelectionChange]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsEditing(true);
    onFocus(block.id);
  }, [block.id, onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    onBlur();
  }, [onBlur]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          // Toggle bold - this would be handled by the parent component
          break;
        case 'i':
          e.preventDefault();
          // Toggle italic
          break;
        case 'u':
          e.preventDefault();
          // Toggle underline
          break;
        case 'k':
          e.preventDefault();
          // Add link
          break;
      }
    }

    // Handle special keys
    switch (e.key) {
      case 'Enter':
        // Let parent handle Enter key
        break;
      case 'Tab':
        e.preventDefault();
        // Handle indentation
        break;
      case 'Escape':
        contentRef.current?.blur();
        break;
    }

    // Call parent key handler
    onKeyDown(e, block.id);
  }, [block.id, onKeyDown]);

  // Update content when block changes externally
  useEffect(() => {
    if (block.content !== lastContent && !isEditing) {
      setLastContent(block.content);
      if (contentRef.current) {
        contentRef.current.innerHTML = applyFormatting(block.content, block.metadata);
      }
    }
  }, [block.content, block.metadata, lastContent, isEditing, applyFormatting]);

  // Apply formatting when metadata changes
  useEffect(() => {
    if (contentRef.current && !isEditing) {
      contentRef.current.innerHTML = applyFormatting(block.content, block.metadata);
    }
  }, [block.metadata, block.content, isEditing, applyFormatting]);

  // Get block-specific styles
  const getBlockStyles = useCallback(() => {
    const baseStyles: React.CSSProperties = {
      fontSize: '16px',
      lineHeight: '1.6',
      padding: '0',
      margin: '0',
      caretColor: 'white',
      outline: 'none',
      border: 'none',
      background: 'transparent',
      color: 'white',
      width: '100%',
      minHeight: '1.5em',
      resize: 'none',
      overflow: 'hidden'
    };

    // Apply block type specific styles
    switch (block.type) {
      case BlockType.HEADING_1:
        baseStyles.fontSize = '32px';
        baseStyles.fontWeight = 'bold';
        baseStyles.lineHeight = '1.2';
        break;
      case BlockType.HEADING_2:
        baseStyles.fontSize = '24px';
        baseStyles.fontWeight = '600';
        baseStyles.lineHeight = '1.3';
        break;
      case BlockType.HEADING_3:
        baseStyles.fontSize = '20px';
        baseStyles.fontWeight = '500';
        baseStyles.lineHeight = '1.4';
        break;
      case BlockType.CODE_BLOCK:
        baseStyles.fontFamily = 'monospace';
        baseStyles.backgroundColor = 'rgba(31, 41, 55, 0.8)';
        baseStyles.color = '#10b981';
        baseStyles.padding = '12px';
        baseStyles.borderRadius = '6px';
        baseStyles.border = '1px solid rgba(75, 85, 99, 0.5)';
        break;
      case BlockType.QUOTE:
        baseStyles.fontStyle = 'italic';
        baseStyles.borderLeft = '4px solid #6b7280';
        baseStyles.paddingLeft = '12px';
        baseStyles.color = '#d1d5db';
        break;
      case BlockType.DIVIDER:
        baseStyles.borderTop = '1px solid #6b7280';
        baseStyles.margin = '16px 0';
        baseStyles.minHeight = '1px';
        break;
    }

    // Apply metadata-based styles
    if (block.metadata.textAlign) {
      baseStyles.textAlign = block.metadata.textAlign;
    }

    if (block.metadata.color) {
      baseStyles.color = block.metadata.color;
    }

    if (block.metadata.backgroundColor) {
      baseStyles.backgroundColor = block.metadata.backgroundColor;
    }

    if (block.metadata.fontSize) {
      baseStyles.fontSize = `${block.metadata.fontSize}px`;
    }

    if (block.metadata.fontWeight) {
      baseStyles.fontWeight = block.metadata.fontWeight;
    }

    return baseStyles;
  }, [block.type, block.metadata]);

  // Get placeholder text
  const getPlaceholder = useCallback(() => {
    switch (block.type) {
      case BlockType.HEADING_1:
        return 'Heading 1';
      case BlockType.HEADING_2:
        return 'Heading 2';
      case BlockType.HEADING_3:
        return 'Heading 3';
      case BlockType.BULLETED_LIST:
        return 'List item';
      case BlockType.NUMBERED_LIST:
        return 'List item';
      case BlockType.TODO_LIST:
        return 'Task item';
      case BlockType.QUOTE:
        return 'Quote text';
      case BlockType.CODE_BLOCK:
        return '// Your code here';
      case BlockType.IMAGE:
        return 'Image description or URL';
      case BlockType.VIDEO:
        return 'Video description or URL';
      case BlockType.BOOKMARK:
        return 'Bookmark URL';
      case BlockType.CALLOUT:
        return 'Callout text';
      case BlockType.MENTION:
        return '@username';
      case BlockType.PAGE_REFERENCE:
        return 'Page title or ID';
      case BlockType.DATABASE_REFERENCE:
        return 'Database name or ID';
      default:
        return placeholder;
    }
  }, [block.type, placeholder]);

  // Auto-resize functionality
  const autoResize = useCallback(() => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [block.content, autoResize]);

  // Add event listeners for selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  return (
    <div
      ref={contentRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={getBlockStyles()}
      className={`
        rich-text-block
        ${isSelected ? 'ring-1 ring-blue-500 ring-opacity-50' : ''}
        ${block.type === BlockType.CODE_BLOCK ? 'font-mono' : ''}
        ${block.type === BlockType.QUOTE ? 'italic' : ''}
        ${block.type === BlockType.DIVIDER ? 'border-t border-gray-600 my-4' : ''}
        transition-all duration-150
        focus:outline-none
        focus:ring-0
        hover:bg-gray-800/30
        rounded
        px-2
        py-1
      `}
      data-block-id={block.id}
      data-block-type={block.type}
      data-placeholder={getPlaceholder()}
      dangerouslySetInnerHTML={{
        __html: applyFormatting(block.content, block.metadata)
      }}
    />
  );
}

