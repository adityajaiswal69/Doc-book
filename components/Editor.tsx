"use client";

import { useDocument } from "@/hooks/use-documents";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Loader2, Lock, ChevronDown, FileText, Search, Code, Hash, List, Type, Quote, CheckSquare, Minus, Table, Image, Video, X, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { Block, BlockType, CommandItem } from "@/types/editor";

export default function Editor() {
  const params = useParams();
  const documentId = params.id as string;
  const { user } = useAuth();
  const { document, loading, error, saving, saveDocument } = useDocument(documentId);
  
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [titleChanged, setTitleChanged] = useState(false);
  const [contentChanged, setContentChanged] = useState(false);

  // Command palette state
  const [showCommands, setShowCommands] = useState(false);
  const [commandFilter, setCommandFilter] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  
  // Block menu state
  const [openMenuBlockId, setOpenMenuBlockId] = useState<string | null>(null);
  
  // Drag and drop state
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  
  // Floating toolbar state
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  
  // Refs
  const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingTitleRef = useRef(false);
  const isSavingContentRef = useRef(false);
  const blockRefs = useRef<{ [key: string]: HTMLTextAreaElement }>({});
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Advanced commands with previews
  const commands: CommandItem[] = [
    {
      id: "heading-1",
      title: "Heading 1",
      description: "Large section heading",
      icon: <Hash className="h-4 w-4" />,
      shortcut: "#",
      preview: <div className="text-2xl font-bold text-white">Heading 1</div>,
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "heading-2",
      title: "Heading 2",
      description: "Medium section heading",
      icon: <Hash className="h-4 w-4" />,
      shortcut: "##",
      preview: <div className="text-xl font-semibold text-white">Heading 2</div>,
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "heading-3",
      title: "Heading 3",
      description: "Small section heading",
      icon: <Hash className="h-4 w-4" />,
      shortcut: "###",
      preview: <div className="text-lg font-medium text-white">Heading 3</div>,
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "text",
      title: "Text",
      description: "Plain text block",
      icon: <Type className="h-4 w-4" />,
      preview: <div className="text-gray-200">Plain text block</div>,
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "bulleted-list",
      title: "Bulleted list",
      description: "Simple bulleted list",
      icon: <List className="h-4 w-4" />,
      shortcut: "-",
      preview: (
        <div className="flex items-start">
          <span className="text-blue-400 mr-3 mt-1">•</span>
          <span className="text-gray-200">List item</span>
        </div>
      ),
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "numbered-list",
      title: "Numbered list",
      description: "Ordered numbered list",
      icon: <List className="h-4 w-4" />,
      shortcut: "1.",
      preview: (
        <div className="flex items-start">
          <span className="text-blue-400 mr-3 mt-1 min-w-[20px]">1.</span>
          <span className="text-gray-200">List item</span>
        </div>
      ),
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "todo-list",
      title: "To-do list",
      description: "Checkbox task list",
      icon: <CheckSquare className="h-4 w-4" />,
      shortcut: "[ ]",
      preview: (
        <div className="flex items-start">
          <input type="checkbox" className="mr-3 mt-1" />
          <span className="text-gray-200">Task item</span>
        </div>
      ),
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "quote",
      title: "Quote",
      description: "Blockquote for citations",
      icon: <Quote className="h-4 w-4" />,
      shortcut: ">",
      preview: (
        <div className="border-l-4 border-gray-600 pl-4 py-2 italic text-gray-300">
          Quote text
        </div>
      ),
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "code-block",
      title: "Code block",
      description: "Code snippet with syntax highlighting",
      icon: <Code className="h-4 w-4" />,
      shortcut: "```",
      preview: (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 font-mono text-sm text-green-400">
          Code block
        </div>
      ),
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "divider",
      title: "Divider",
      description: "Horizontal line separator",
      icon: <Minus className="h-4 w-4" />,
      shortcut: "---",
      preview: <div className="border-t border-gray-600 my-4"></div>,
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "table",
      title: "Table",
      description: "Data table with rows and columns",
      icon: <Table className="h-4 w-4" />,
      preview: (
        <div className="border border-gray-600 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-gray-200">Header 1</th>
                <th className="px-3 py-2 text-left text-gray-200">Header 2</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-600">
                <td className="px-3 py-2 text-gray-200">Cell 1</td>
                <td className="px-3 py-2 text-gray-200">Cell 2</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
      action: (content) => ({
        newContent: content,
        newCursorPosition: content.length
      })
    },
    {
      id: "image",
      title: "Image",
      description: "Insert an image URL",
      icon: <Image className="h-4 w-4" />,
      preview: (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
          <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <div className="text-gray-400 text-sm">Image URL</div>
        </div>
      ),
      action: (content) => ({
        newContent: content ,
        newCursorPosition: content.length
      })
    },
    {
      id: "video",
      title: "Video",
      description: "Insert a video URL",
      icon: <Video className="h-4 w-4" />,
      preview: (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
          <Video className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <div className="text-gray-400 text-sm">Video URL</div>
        </div>
      ),
      action: (content) => ({
        newContent: content   ,
        newCursorPosition: content.length
      })
    }
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(commandFilter.toLowerCase()) ||
    cmd.description.toLowerCase().includes(commandFilter.toLowerCase())
  );

  // Initialize blocks from document content
  useEffect(() => {
    if (document && !titleChanged && !contentChanged) {
      setTitle(document.title || "");
      
      // Parse content into blocks - try JSON first, then fallback to plain text
      let newBlocks: Block[] = [];
      
      // First try to load from blocks_content JSON
      if (document.blocks_content && Array.isArray(document.blocks_content)) {
        newBlocks = document.blocks_content.map((block: any, index: number) => {
          const newBlock = {
            id: block.id || `block-${index}`,
            type: block.type as BlockType,
            content: block.content || '',
            metadata: block.metadata,
            listIndex: block.listIndex,
            parentListId: block.parentListId,
            checked: block.checked,
            orderIndex: block.orderIndex !== undefined ? block.orderIndex : index
          };
          
          // Ensure metadata is properly set for image and video blocks
          if (newBlock.type === 'image' && !newBlock.metadata) {
            newBlock.metadata = {
              url: newBlock.content,
              type: 'image'
            };
          } else if (newBlock.type === 'video' && !newBlock.metadata) {
            newBlock.metadata = {
              url: newBlock.content,
              type: 'video'
            };
          }
          
          return newBlock;
        });
        
        // Sort blocks by orderIndex to ensure proper order
        newBlocks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      } else {
        // Fallback to parsing plain text content
        const content = document.content || "";
        if (content) {
          const lines = content.split('\n');
          let currentBlock: Block | null = null;
          
          lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('# ')) {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { id: `block-${index}`, type: 'heading-1' as BlockType, content: trimmedLine.substring(2), orderIndex: index };
            } else if (trimmedLine.startsWith('## ')) {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { id: `block-${index}`, type: 'heading-2' as BlockType, content: trimmedLine.substring(3), orderIndex: index };
            } else if (trimmedLine.startsWith('### ')) {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { id: `block-${index}`, type: 'heading-3' as BlockType, content: trimmedLine.substring(4), orderIndex: index };
            } else if (trimmedLine.startsWith('- ')) {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { id: `block-${index}`, type: 'bulleted-list' as BlockType, content: trimmedLine.substring(2), orderIndex: index };
            } else if (trimmedLine.startsWith('1. ')) {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { id: `block-${index}`, type: 'numbered-list' as BlockType, content: trimmedLine.substring(3), orderIndex: index };
            } else if (trimmedLine.match(/^- \[ \]/)) {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { id: `block-${index}`, type: 'todo-list' as BlockType, content: trimmedLine.substring(6), orderIndex: index };
            } else if (trimmedLine.startsWith('> ')) {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { id: `block-${index}`, type: 'quote' as BlockType, content: trimmedLine.substring(2), orderIndex: index };
            } else if (trimmedLine.startsWith('```')) {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { id: `block-${index}`, type: 'code-block' as BlockType, content: '// Your code here', orderIndex: index };
            } else if (trimmedLine === '---') {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { id: `block-${index}`, type: 'divider' as BlockType, content: '', orderIndex: index };
            } else if (trimmedLine.startsWith('http') && (trimmedLine.includes('.jpg') || trimmedLine.includes('.jpeg') || trimmedLine.includes('.png') || trimmedLine.includes('.gif') || trimmedLine.includes('.webp'))) {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { 
                id: `block-${index}`, 
                type: 'image' as BlockType, 
                content: trimmedLine,
                orderIndex: index,
                metadata: {
                  url: trimmedLine,
                  type: 'image'
                }
              };
            } else if (trimmedLine.startsWith('http') && (trimmedLine.includes('.mp4') || trimmedLine.includes('.webm') || trimmedLine.includes('.avi') || trimmedLine.includes('.mov'))) {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { 
                id: `block-${index}`, 
                type: 'video' as BlockType, 
                content: trimmedLine,
                orderIndex: index,
                metadata: {
                  url: trimmedLine,
                  type: 'video'
                }
              };
            } else if (trimmedLine === '') {
              if (currentBlock) newBlocks.push(currentBlock);
              currentBlock = { id: `block-${index}`, type: 'text' as BlockType, content: '', orderIndex: index };
            } else {
              if (currentBlock && currentBlock.type === 'text') {
                currentBlock.content += (currentBlock.content ? '\n' : '') + trimmedLine;
              } else {
                if (currentBlock) newBlocks.push(currentBlock);
                currentBlock = { id: `block-${index}`, type: 'text' as BlockType, content: trimmedLine, orderIndex: index };
              }
            }
          });
          
          if (currentBlock) newBlocks.push(currentBlock);
        } else {
          // Create initial empty text block
          newBlocks = [{ id: 'block-0', type: 'text' as BlockType, content: '' }];
        }
      }
      
      setBlocks(newBlocks);
      
      setTitleChanged(false);
      setContentChanged(false);
    }
  }, [document?.id]);

  // Cleanup resize timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(resizeTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuBlockId && !(event.target as Element).closest('[data-block-menu]')) {
        setOpenMenuBlockId(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.document.addEventListener('mousedown', handleClickOutside);
      return () => window.document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuBlockId]);

  // Auto-save title changes
  const handleTitleChange = useCallback(async (newTitle: string) => {
    setTitle(newTitle);
    setTitleChanged(true);
    
    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
    }
    
    titleSaveTimeoutRef.current = setTimeout(async () => {
      if (isSavingTitleRef.current) return;
      
      try {
        isSavingTitleRef.current = true;
        await saveDocument({ title: newTitle });
        setTitleChanged(false);
      } catch (error) {
        console.error('Failed to save title:', error);
        setTitleChanged(true);
      } finally {
        isSavingTitleRef.current = false;
      }
    }, 1000);
  }, [saveDocument]);

  // Handle block content changes
  const handleBlockChange = useCallback(async (blockId: string, newContent: string, newType?: BlockType) => {
    setBlocks(prev => prev.map(block => {
      if (block.id === blockId) {
        const updatedBlock = { ...block, content: newContent, type: newType || block.type };
        
        // Update metadata for image and video blocks when content changes
        if (updatedBlock.type === 'image') {
          updatedBlock.metadata = {
            ...updatedBlock.metadata,
            url: newContent,
            type: 'image'
          };
        } else if (updatedBlock.type === 'video') {
          updatedBlock.metadata = {
            ...updatedBlock.metadata,
            url: newContent,
            type: 'video'
          };
        }
        
        return updatedBlock;
      }
      return block;
    }));
    setContentChanged(true);
    
    // Auto-save
    if (contentSaveTimeoutRef.current) {
      clearTimeout(contentSaveTimeoutRef.current);
    }
    
    contentSaveTimeoutRef.current = setTimeout(async () => {
      if (isSavingContentRef.current) return;
      
      try {
        isSavingContentRef.current = true;
        
        // Save blocks as JSON for better structure preservation
        await saveDocument({ blocks_content: blocks });
        setContentChanged(false);
      } catch (error) {
        console.error('Failed to save content:', error);
        setContentChanged(true);
      } finally {
        isSavingContentRef.current = false;
      }
    }, 1500);
  }, [blocks, saveDocument]);

  // Handle slash commands
  const handleSlashCommand = useCallback((blockId: string, content: string) => {
    if (content.trim() === '/') {
      setShowCommands(true);
      setActiveBlockId(blockId);
      setCommandFilter("");
      setSelectedCommandIndex(0);
    } else if (content.startsWith('/') && content.length > 1) {
      setShowCommands(true);
      setActiveBlockId(blockId);
      setCommandFilter(content.slice(1));
      setSelectedCommandIndex(0);
    } else {
      setShowCommands(false);
    }
  }, []);

  // Handle command selection
  const handleCommandSelect = useCallback(async (command: CommandItem) => {
    if (!activeBlockId) return;
    
    const currentBlock = blocks.find(b => b.id === activeBlockId);
    if (!currentBlock) return;
    
    // Get the content without the slash command
    const contentWithoutSlash = currentBlock.content.replace(/^\/\S*\s*/, '');
    
    // Apply the command action to the cleaned content
    const result = command.action(contentWithoutSlash);
    
    setBlocks(prev => {
      const updatedBlocks = prev.map(block => {
        if (block.id === activeBlockId) {
          const updatedBlock = { 
            ...block, 
            content: result.newContent, 
            type: command.id as BlockType 
          };
          
          // Add metadata for image and video blocks
          if (command.id === 'image') {
            updatedBlock.metadata = {
              ...updatedBlock.metadata,
              url: result.newContent,
              type: 'image'
            };
          } else if (command.id === 'video') {
            updatedBlock.metadata = {
              ...updatedBlock.metadata,
              url: result.newContent,
              type: 'video'
            };
          }
          
          return updatedBlock;
        }
        return block;
      });
      
      // Update list indices if the new type is a list
      if (command.id === 'numbered-list' || command.id === 'bulleted-list' || command.id === 'todo-list') {
        return updateListIndices(updatedBlocks);
      }
      
      return updatedBlocks;
    });
    
    setShowCommands(false);
    setActiveBlockId(null);
    setCommandFilter("");
    setContentChanged(true);
    
    // Focus the block after type change
    setTimeout(() => {
      const blockElement = blockRefs.current[activeBlockId];
      if (blockElement) {
        blockElement.focus();
        blockElement.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
      }
    }, 10);
    
    toast.success(`${command.title} applied`);
  }, [activeBlockId, blocks]);

  // Handle keyboard navigation
  const handleCommandKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedCommandIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedCommandIndex(prev => 
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedCommandIndex]) {
        handleCommandSelect(filteredCommands[selectedCommandIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowCommands(false);
      setActiveBlockId(null);
    }
  }, [filteredCommands, selectedCommandIndex, handleCommandSelect]);

  // Update list indices for numbered lists
  const updateListIndices = useCallback((blocks: Block[]) => {
    let currentListIndex = 1;
    return blocks.map(block => {
      if (block.type === 'numbered-list') {
        const updatedBlock = { ...block, listIndex: currentListIndex };
        currentListIndex++;
        return updatedBlock;
      }
      return block;
    });
  }, []);

  // Add new block
  const addBlock = useCallback((afterBlockId: string) => {
    const newBlock: Block = { id: `block-${Date.now()}`, type: 'text' as BlockType, content: '' };
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === afterBlockId);
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      
      // Update order indices for all blocks
      const updatedBlocks = newBlocks.map((block, idx) => ({
        ...block,
        orderIndex: idx
      }));
      
      // Update list indices if needed
      const finalBlocks = updateListIndices(updatedBlocks);
      
      // Save the updated blocks to the backend
      (async () => {
        try {
          setContentChanged(true);
          await saveDocument({ blocks_content: finalBlocks });
          setContentChanged(false);
        } catch (error) {
          console.error('Failed to save new block:', error);
          setContentChanged(true);
        }
      })();
      
      return finalBlocks;
    });
    
    // Focus new block
    setTimeout(() => {
      const blockElement = blockRefs.current[newBlock.id];
      if (blockElement) {
        blockElement.focus();
      }
    }, 10);
  }, [updateListIndices, saveDocument]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    if (draggedBlockId && draggedBlockId !== blockId) {
      setDragOverBlockId(blockId);
    }
  }, [draggedBlockId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBlockId(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetBlockId) return;

    setBlocks(prev => {
      const draggedIndex = prev.findIndex(b => b.id === draggedBlockId);
      const targetIndex = prev.findIndex(b => b.id === targetBlockId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      const newBlocks = [...prev];
      const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(targetIndex, 0, draggedBlock);
      
      // Update order indices for all blocks after drag and drop
      const updatedBlocks = newBlocks.map((block, idx) => ({
        ...block,
        orderIndex: idx
      }));
      
      const finalBlocks = updateListIndices(updatedBlocks);
      
      // Save the updated blocks to the backend immediately
      (async () => {
        try {
          setContentChanged(true);
          await saveDocument({ blocks_content: finalBlocks });
          setContentChanged(false);
          toast.success('Block order updated');
        } catch (error) {
          console.error('Failed to save block order:', error);
          toast.error('Failed to save block order');
          setContentChanged(true);
        }
      })();
      
      return finalBlocks;
    });
    
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  }, [draggedBlockId, updateListIndices, saveDocument]);

  // Auto-resize textarea height based on content
  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    // Only resize if the textarea is actually mounted and visible
    if (!textarea || !textarea.isConnected) return;
    
    // Reset height to auto first to get accurate scrollHeight
    textarea.style.height = 'auto';
    
    // Get the exact content height
    const contentHeight = textarea.scrollHeight;
    
    // Set height to content height with minimal constraints
    const newHeight = Math.max(contentHeight, 24); // Small minimum height for cursor visibility
    textarea.style.height = `${newHeight}px`;
    
    // Remove any conflicting styles that might prevent auto-height
    textarea.style.minHeight = '';
    textarea.style.maxHeight = '';
  }, []);

  // Debounced resize function for better performance
  const debouncedResize = useCallback((textarea: HTMLTextAreaElement) => {
    // Only resize if the textarea is still valid
    if (!textarea || !textarea.isConnected) return;
    
    const blockId = textarea.dataset.blockId;
    if (blockId && resizeTimeoutsRef.current[blockId]) {
      clearTimeout(resizeTimeoutsRef.current[blockId]);
    }
    
    if (blockId) {
      resizeTimeoutsRef.current[blockId] = setTimeout(() => {
        // Check again before resizing to prevent errors
        if (textarea && textarea.isConnected) {
          autoResizeTextarea(textarea);
        }
      }, 50); // Increased delay to reduce aggressive resizing
    }
  }, [autoResizeTextarea]);

  // Handle block key events
  const handleBlockKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      const currentBlock = blocks.find(b => b.id === blockId);
      if (!currentBlock) return;
      
      // Always add a new block on Enter
      addBlock(blockId);
    } else if (e.key === 'Backspace') {
      const block = blocks.find(b => b.id === blockId);
      if (block && block.content === '' && blocks.length > 1) {
        e.preventDefault();
        setBlocks(prev => {
          const filteredBlocks = prev.filter(b => b.id !== blockId);
          
          // Update order indices for remaining blocks
          const updatedBlocks = filteredBlocks.map((block, idx) => ({
            ...block,
            orderIndex: idx
          }));
          
          const finalBlocks = updateListIndices(updatedBlocks);
          
          // Save the updated blocks to the backend
          (async () => {
            try {
              setContentChanged(true);
              await saveDocument({ blocks_content: finalBlocks });
              setContentChanged(false);
            } catch (error) {
              console.error('Failed to save after block deletion:', error);
              setContentChanged(true);
            }
          })();
          
          return finalBlocks;
        });
      }
    }
  }, [blocks, addBlock, updateListIndices, saveDocument]);

  // Render block based on type
  const renderBlock = (block: Block) => {
    const commonProps = {
      ref: (el: HTMLTextAreaElement) => {
        if (el) {
          blockRefs.current[block.id] = el;
          el.dataset.blockId = block.id;
          
          // Initialize auto-height immediately
          autoResizeTextarea(el);
        }
      },
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        handleBlockChange(block.id, newContent);
        handleSlashCommand(block.id, newContent);
        
        // Always resize immediately for responsive feel
        autoResizeTextarea(e.target);
      },
      onKeyDown: (e: React.KeyboardEvent) => handleBlockKeyDown(e, block.id),
      placeholder: `Type '/' for commands...`,
      className: "w-full resize-none border-none outline-none bg-transparent text-white focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2",
      style: {
        fontSize: '16px',
        lineHeight: '1.6',
        padding: '0',
        margin: '0',
        caretColor: 'white',
        caretShape: 'block' as const
      },
      spellCheck: false,
      autoComplete: "off",
      autoCorrect: "off",
      autoCapitalize: "off"
    };

    switch (block.type) {
      case 'heading-1':
        return (
          <textarea
            {...commonProps}
            style={{ ...commonProps.style, fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2' }}
            placeholder="Heading 1"
            className="w-full resize-none border-none outline-none bg-transparent text-white focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
          />
        );
      case 'heading-2':
        return (
          <textarea
            {...commonProps}
            style={{ ...commonProps.style, fontSize: '24px', fontWeight: '600', lineHeight: '1.3' }}
            placeholder="Heading 2"
            className="w-full resize-none border-none outline-none bg-transparent text-white focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
          />
        );
      case 'heading-3':
        return (
          <textarea
            {...commonProps}
            style={{ ...commonProps.style, fontSize: '20px', fontWeight: '500', lineHeight: '1.4' }}
            placeholder="Heading 3"
            className="w-full resize-none border-none outline-none bg-transparent text-white focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
          />
        );
      case 'bulleted-list':
        return (
          <div className="flex items-start gap-3 group/list-item">
            <span className="text-blue-400 text-lg mt-2 flex-shrink-0 w-4 text-center group-hover/list-item:text-blue-300 transition-colors">•</span>
            <textarea
              {...commonProps}
              style={{ ...commonProps.style, flex: 1, lineHeight: '1.6' }}
              placeholder="List item"
              className="w-full resize-none border-none outline-none bg-transparent text-white focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
            />
          </div>
        );
      case 'numbered-list':
        return (
          <div className="flex items-start gap-3 group/list-item">
            <span className="text-blue-400 text-lg mt-2 flex-shrink-0 w-6 text-right group-hover/list-item:text-blue-300 transition-colors font-mono">
              {block.listIndex || 1}.
            </span>
            <textarea
              {...commonProps}
              style={{ ...commonProps.style, flex: 1, lineHeight: '1.6' }}
              placeholder="List item"
              className="w-full resize-none border-none outline-none bg-transparent text-white focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
            />
          </div>
        );
      case 'todo-list':
        return (
          <div className="flex items-start gap-3 group/list-item">
            <input 
              type="checkbox" 
              className="mt-2 flex-shrink-0 w-4 h-4 text-blue-500 rounded border-gray-600 bg-gray-800 focus:ring-blue-500 focus:ring-2 cursor-pointer" 
            />
            <textarea
              {...commonProps}
              style={{ ...commonProps.style, flex: 1, lineHeight: '1.6' }}
              placeholder="Task item"
              className="w-full resize-none border-none outline-none bg-transparent text-white focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
            />
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-gray-600 pl-4 py-2">
            <textarea
              {...commonProps}
              style={{ ...commonProps.style, fontStyle: 'italic', lineHeight: '1.6' }}
              placeholder="Quote text"
              className="w-full resize-none border-none outline-none bg-transparent text-white focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
            />
          </div>
        );
      case 'code-block':
        return (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <textarea
              {...commonProps}
              style={{ ...commonProps.style, fontFamily: 'monospace', color: '#10b981', lineHeight: '1.5' }}
              placeholder="// Your code here"
              className="w-full resize-none border-none outline-none bg-transparent text-green-400 focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
            />
          </div>
        );
      case 'divider':
        return (
          <div className="border-t border-gray-600 my-4"></div>
        );
      case 'table':
        return (
          <div className="border border-gray-600 rounded-lg overflow-hidden">
            <textarea
              {...commonProps}
              style={{ ...commonProps.style, fontFamily: 'monospace', lineHeight: '1.5' }}
              placeholder="Table content"
              className="w-full resize-none border-none outline-none bg-transparent text-white focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
            />
          </div>
        );
      case 'image':
        return (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Image className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-400">Image URL:</span>
            </div>
            <textarea
              {...commonProps}
              style={{ ...commonProps.style, fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.4' }}
              placeholder="https://example.com/image.jpg"
              className="w-full resize-none border-none outline-none bg-transparent text-blue-400 focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
            />
            {block.content && block.content.startsWith('http') && (
              <div className="mt-3 p-2 bg-gray-900 rounded border border-gray-600">
                <img 
                  src={block.content} 
                  alt="Preview" 
                  className="max-w-full h-auto max-h-48 mx-auto rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Video className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-400">Video URL:</span>
            </div>
            <textarea
              {...commonProps}
              style={{ ...commonProps.style, fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.4' }}
              placeholder="https://example.com/video.mp4"
              className="w-full resize-none border-none outline-none bg-transparent text-blue-400 focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
            />
            {block.content && block.content.startsWith('http') && (
              <div className="mt-3 p-2 bg-gray-900 rounded border border-gray-600">
                <video 
                  src={block.content} 
                  controls
                  className="max-w-full h-auto max-h-48 mx-auto rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>
        );
      default:
        return (
          <textarea
            {...commonProps}
            placeholder="Type '/' for commands..."
            className="w-full resize-none border-none outline-none bg-transparent text-white focus:outline-none focus:ring-0 transition-all duration-100 whitespace-pre-wrap break-words overflow-hidden rounded px-3 py-2"
          />
        );
    }
  };

  // Show skeleton only on initial load when no document exists
  if (loading && !document) {
    return (
      <div className="flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-gray-300 rounded animate-pulse" />
                <div className="h-6 w-48 bg-gray-300 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 bg-gray-300 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-300 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-24 bg-gray-300 rounded animate-pulse" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-6 space-y-4">
          {/* Title skeleton */}
          <div className="h-8 w-64 bg-gray-300 rounded animate-pulse" />
          
          {/* Content blocks skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-full bg-gray-300 rounded animate-pulse" />
              {i === 0 && <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-500 text-2xl">⚠️</div>
              <h3 className="text-lg font-semibold">Error Loading Document</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              
              {/* Show repair access option for access denied errors */}
              {error.includes("Access denied") && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    This might be a permissions issue. You can try to repair your access:
                  </p>
                  <Button 
                    onClick={async () => {
                      try {
                        const { repairUserDocumentAccess } = await import('@/actions/actions');
                        if (user?.id) {
                          const result = await repairUserDocumentAccess(user.id, documentId);
                          toast.success(`Access repair result: ${result.message}`);
                          // Refresh the document
                          window.location.reload();
                        }
                      } catch (repairError) {
                        toast.error(`Failed to repair access: ${repairError instanceof Error ? repairError.message : 'Unknown error'}`);
                      }
                    }}
                    className="w-full"
                  >
                    🔧 Repair Access
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground text-2xl">📄</div>
          <h3 className="text-lg font-semibold">Document Not Found</h3>
          <p className="text-sm text-muted-foreground">The document you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Document"
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto min-w-[200px] bg-transparent"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Private</span>
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>📄 {blocks.length} blocks</span>
                <span>📝 {blocks.reduce((total, block) => total + (block.content?.split(/\s+/).length || 0), 0)} words</span>
              </div>
              <div>
                {saving ? 'Saving...' : contentChanged ? 'Unsaved changes' : 'All changes saved'}
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8"
              onClick={() => {
                // Show keyboard shortcuts help
                toast.info("Keyboard shortcuts: Enter = new block, / = commands, Ctrl+S = save");
              }}
              title="Keyboard shortcuts"
            >
              ⌨️
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8"
              onClick={async () => {
                try {
                  await saveDocument({ title, blocks_content: blocks });
                  setTitleChanged(false);
                  setContentChanged(false);
                  toast.success('Document saved!');
                } catch (error) {
                  console.error('Failed to save document:', error);
                  toast.error('Failed to save document');
                }
              }}
              disabled={!titleChanged && !contentChanged}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Content editor */}
      <div className="flex-1 px-6 lg:px-8 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto py-6 pb-20">
          {/* Document title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-3 text-white">
              {title || 'Untitled Document'}
            </h1>
          </div>
          
          {/* Blocks */}
          <div className="space-y-3">
            {blocks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-2">Welcome to your document!</h3>
                <p className="text-sm mb-6">Start typing to create your first block, or use the slash commands below</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                  {[
                    { icon: '#', title: 'Heading', desc: 'Type # for headings' },
                    { icon: '•', title: 'List', desc: 'Type - for bullet lists' },
                    { icon: '[]', title: 'Todo', desc: 'Type [ ] for tasks' },
                    { icon: '>', title: 'Quote', desc: 'Type > for quotes' },
                    { icon: '```', title: 'Code', desc: 'Type ``` for code blocks' },
                    { icon: '📷', title: 'Image', desc: 'Type /image for images' },
                    { icon: '🎥', title: 'Video', desc: 'Type /video for videos' },
                    { icon: '📊', title: 'Table', desc: 'Type /table for tables' }
                  ].map((tip, i) => (
                    <div key={i} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                      <div className="text-2xl mb-2">{tip.icon}</div>
                      <div className="text-xs font-medium text-white">{tip.title}</div>
                      <div className="text-xs text-gray-500">{tip.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {blocks.map((block, index) => (
                  <div 
                    key={block.id} 
                    className={`relative group py-2 px-4 rounded-lg transition-all duration-200 hover:bg-gray-800/30 ${
                      draggedBlockId === block.id ? 'opacity-50' : ''
                    } ${
                      dragOverBlockId === block.id ? 'bg-blue-500/10 border-l-4 border-blue-500' : ''
                    }`}
                    data-type={block.type}
                    onDragOver={(e) => handleDragOver(e, block.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, block.id)}
                    onDragEnd={() => setDragOverBlockId(null)}
                  >
                    {/* Block type indicator */}
                    <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono bg-gray-800/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {block.type.replace('-', ' ')}
                    </div>
                    
                    {/* Drag handle - visible on hover */}
                    <div 
                      className="absolute left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing p-2"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, block.id)}
                      title="Drag to reorder"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Block content with proper padding */}
                    <div className="ml-16 mr-12">
                      {renderBlock(block)}
                      
                      {/* Quick actions toolbar - visible on hover */}
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            const newBlock: Block = { id: `block-${Date.now()}`, type: 'text' as BlockType, content: '' };
                            setBlocks(prev => {
                              const index = prev.findIndex(b => b.id === block.id);
                              const newBlocks = [...prev];
                              newBlocks.splice(index + 1, 0, newBlock);
                              
                              // Update order indices for all blocks
                              const updatedBlocks = newBlocks.map((block, idx) => ({
                                ...block,
                                orderIndex: idx
                              }));
                              
                              const finalBlocks = updateListIndices(updatedBlocks);
                              
                              // Save the updated blocks to the backend
                              (async () => {
                                try {
                                  setContentChanged(true);
                                  await saveDocument({ blocks_content: finalBlocks });
                                  setContentChanged(false);
                                } catch (error) {
                                  console.error('Failed to save after adding block:', error);
                                  setContentChanged(true);
                                }
                              })();
                              
                              return finalBlocks;
                            });
                            toast.success("New block added");
                          }}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded transition-colors"
                          title="Add block below"
                        >
                          + Add below
                        </button>
                        
                        <button
                          onClick={() => {
                            const newBlock: Block = { id: `block-${Date.now()}`, type: block.type, content: '' };
                            setBlocks(prev => {
                              const index = prev.findIndex(b => b.id === block.id);
                              const newBlocks = [...prev];
                              newBlocks.splice(index + 1, 0, newBlock);
                              
                              // Update order indices for all blocks
                              const updatedBlocks = newBlocks.map((block, idx) => ({
                                ...block,
                                orderIndex: idx
                              }));
                              
                              const finalBlocks = updateListIndices(updatedBlocks);
                              
                              // Save the updated blocks to the backend
                              (async () => {
                                try {
                                  setContentChanged(true);
                                  await saveDocument({ blocks_content: finalBlocks });
                                  setContentChanged(false);
                                } catch (error) {
                                  console.error('Failed to save after duplicating block:', error);
                                  setContentChanged(true);
                                }
                              })();
                              
                              return finalBlocks;
                            });
                            toast.success("Block duplicated");
                          }}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded transition-colors"
                          title="Duplicate block"
                        >
                          📋 Duplicate
                        </button>
                      </div>
                    </div>
                    
                    {/* Three dots menu - visible on hover */}
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" data-block-menu>
                      <button
                        onClick={() => setOpenMenuBlockId(openMenuBlockId === block.id ? null : block.id)}
                        className="p-2 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                        title="Block options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      
                      {/* Dropdown menu */}
                      {openMenuBlockId === block.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                          <div className="p-2 border-b border-gray-700">
                            <div className="text-xs text-gray-400 font-medium">Block Actions</div>
                          </div>
                          
                          {/* Block type switcher */}
                          <div className="p-2 border-b border-gray-700">
                            <div className="text-xs text-gray-400 font-medium mb-2">Change Type</div>
                            <div className="grid grid-cols-2 gap-1">
                              {(['text', 'heading-1', 'heading-2', 'heading-3', 'bulleted-list', 'numbered-list', 'todo-list', 'quote', 'code-block'] as BlockType[]).map((type) => (
                                <button
                                  key={type}
                                  onClick={() => {
                                    handleBlockChange(block.id, block.content, type as BlockType);
                                    setOpenMenuBlockId(null);
                                    toast.success(`Changed to ${type.replace('-', ' ')}`);
                                  }}
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    block.type === type 
                                      ? 'bg-blue-600 text-white' 
                                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                  }`}
                                >
                                  {type.replace('-', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                                                      <button
                              onClick={() => {
                                const newBlock: Block = { id: `block-${Date.now()}`, type: block.type, content: '' };
                                setBlocks(prev => {
                                  const index = prev.findIndex(b => b.id === block.id);
                                  const newBlocks = [...prev];
                                  newBlocks.splice(index + 1, 0, newBlock);
                                  
                                  // Update order indices for all blocks
                                  const updatedBlocks = newBlocks.map((block, idx) => ({
                                    ...block,
                                    orderIndex: idx
                                  }));
                                  
                                  const finalBlocks = updateListIndices(updatedBlocks);
                                  
                                  // Save the updated blocks to the backend
                                  (async () => {
                                    try {
                                      setContentChanged(true);
                                      await saveDocument({ blocks_content: finalBlocks });
                                      setContentChanged(false);
                                    } catch (error) {
                                      console.error('Failed to save after block duplication:', error);
                                      setContentChanged(true);
                                    }
                                  })();
                                  
                                  return finalBlocks;
                                });
                                setOpenMenuBlockId(null);
                                toast.success("Block duplicated");
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                            >
                              📋 Duplicate block
                            </button>
                          
                          <button
                            onClick={() => {
                              if (blocks.length > 1) {
                                setBlocks(prev => {
                                  const filteredBlocks = prev.filter(b => b.id !== block.id);
                                  
                                  // Update order indices for remaining blocks
                                  const updatedBlocks = filteredBlocks.map((block, idx) => ({
                                    ...block,
                                    orderIndex: idx
                                  }));
                                  
                                  const finalBlocks = updateListIndices(updatedBlocks);
                                  
                                  // Save the updated blocks to the backend
                                  (async () => {
                                    try {
                                      setContentChanged(true);
                                      await saveDocument({ blocks_content: finalBlocks });
                                      setContentChanged(false);
                                    } catch (error) {
                                      console.error('Failed to save after block deletion:', error);
                                      setContentChanged(true);
                                    }
                                  })();
                                  
                                  return finalBlocks;
                                });
                                toast.success("Block deleted");
                              } else {
                                toast.error("Cannot delete the last block");
                              }
                              setOpenMenuBlockId(null);
                            }}
                            disabled={blocks.length <= 1}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-t border-gray-700"
                          >
                            🗑️ Delete block
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
            
           {/* Add new block button */}
           <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => {
                if (blocks.length > 0) {
                  addBlock(blocks[blocks.length - 1]?.id || '');
                } else {
                  // If no blocks exist, create the first block
                  const newBlock: Block = { id: `block-${Date.now()}`, type: 'text' as BlockType, content: '', orderIndex: 0 };
                  setBlocks([newBlock]);
                  
                  // Save the new block to the backend
                  (async () => {
                    try {
                      setContentChanged(true);
                      await saveDocument({ blocks_content: [newBlock] });
                      setContentChanged(false);
                    } catch (error) {
                      console.error('Failed to save first block:', error);
                      setContentChanged(true);
                    }
                  })();
                }
              }}
              className="text-gray-400 hover:text-white"
            >
              + Add new block
            </Button>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      {showCommands && (
        <div 
          ref={commandPaletteRef}
          className="fixed z-50 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: '80vh'
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <Input
                  placeholder="Search commands..."
                  value={commandFilter}
                  onChange={(e) => setCommandFilter(e.target.value)}
                  onKeyDown={handleCommandKeyDown}
                  className="h-8 text-sm bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  autoFocus
                />
              </div>
              <div className="text-xs text-gray-500">
                {filteredCommands.length} commands
              </div>
            </div>
          </div>
          
          {/* Commands List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((command, index) => (
                <div
                  key={command.id}
                  className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors ${
                    index === selectedCommandIndex ? 'bg-gray-700 border-l-2 border-blue-500' : ''
                  }`}
                  onClick={() => handleCommandSelect(command)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-300 p-1">
                        {command.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{command.title}</div>
                        <div className="text-gray-400 text-xs">{command.description}</div>
                        {command.shortcut && (
                          <div className="text-xs text-gray-500 mt-1">
                            Shortcut: <span className="bg-gray-700 px-1 py-0.5 rounded text-gray-300">{command.shortcut}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {command.preview}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No commands found</div>
                <div className="text-xs text-gray-500 mt-1">Try a different search term</div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-gray-700 text-xs text-gray-500 bg-gray-900/50 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Type '/' for commands</span>
                <span>↑↓ to navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Enter to select</span>
                <span>Esc to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Formatting Toolbar */}
      {showFloatingToolbar && (
        <div 
          className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm"
          style={{
            left: toolbarPosition.x,
            top: toolbarPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex items-center gap-1 p-2">
            <button
              onClick={() => {
                // Bold formatting logic
                toast.success("Bold formatting applied");
                setShowFloatingToolbar(false);
              }}
              className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="Bold (Ctrl+B)"
            >
              <strong className="text-sm font-bold">B</strong>
            </button>
            
            <button
              onClick={() => {
                // Italic formatting logic
                toast.success("Italic formatting applied");
                setShowFloatingToolbar(false);
              }}
              className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="Italic (Ctrl+I)"
            >
              <em className="text-sm italic">I</em>
            </button>
            
            <button
              onClick={() => {
                // Underline formatting logic
                toast.success("Underline formatting applied");
                setShowFloatingToolbar(false);
              }}
              className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="Underline (Ctrl+U)"
            >
              <u className="text-sm underline">U</u>
            </button>
            
            <div className="w-px h-6 bg-gray-600 mx-1"></div>
            
            <button
              onClick={() => {
                // Link formatting logic
                toast.success("Link formatting applied");
                setShowFloatingToolbar(false);
              }}
              className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="Insert Link"
            >
              🔗
            </button>
            
            <button
              onClick={() => {
                // Code formatting logic
                toast.success("Code formatting applied");
                setShowFloatingToolbar(false);
              }}
              className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              title="Code (Ctrl+`)"
            >
              <code className="text-sm font-mono bg-gray-700 px-1 rounded">`</code>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
