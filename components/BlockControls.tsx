"use client";

import { useState } from "react";
import { 
  GripVertical, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link, 
  MoreHorizontal,
  Copy,
  MessageSquare,
  Trash2,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu";
import { RichBlock, BlockType } from "@/types/editor";

interface BlockControlsProps {
  block: RichBlock;
  isSelected: boolean;
  onBlockTypeChange: (blockId: string, newType: BlockType) => void;
  onFormatChange: (blockId: string, format: string, value: any) => void;
  onDuplicate: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onAddComment: (blockId: string) => void;
  onDragStart: (e: React.DragEvent, block: RichBlock) => void;
}

export default function BlockControls({
  block,
  isSelected,
  onBlockTypeChange,
  onFormatChange,
  onDuplicate,
  onDelete,
  onAddComment,
  onDragStart
}: BlockControlsProps) {
  const [showFormatting, setShowFormatting] = useState(false);

  const blockTypeOptions = [
    { value: BlockType.PARAGRAPH, label: "Text", icon: "T" },
    { value: BlockType.HEADING_1, label: "Heading 1", icon: "H1" },
    { value: BlockType.HEADING_2, label: "Heading 2", icon: "H2" },
    { value: BlockType.HEADING_3, label: "Heading 3", icon: "H3" },
    { value: BlockType.BULLETED_LIST, label: "Bulleted list", icon: "•" },
    { value: BlockType.NUMBERED_LIST, label: "Numbered list", icon: "1." },
    { value: BlockType.TOGGLE_LIST, label: "Toggle list", icon: "▶" },
    { value: BlockType.TODO_LIST, label: "To-do list", icon: "☐" },
    { value: BlockType.QUOTE, label: "Quote", icon: "❝" },
    { value: BlockType.CODE_BLOCK, label: "Code block", icon: "{}" },
    { value: BlockType.DIVIDER, label: "Divider", icon: "—" },
    { value: BlockType.TABLE, label: "Table", icon: "⊞" },
    { value: BlockType.IMAGE, label: "Image", icon: <ImageIcon className="h-4 w-4" /> },
    { value: BlockType.VIDEO, label: "Video", icon: <VideoIcon className="h-4 w-4" /> },
    { value: BlockType.BOOKMARK, label: "Bookmark", icon: "🔖" },
    { value: BlockType.CALLOUT, label: "Callout", icon: "💡" },
    { value: BlockType.COLUMNS, label: "Columns", icon: "⊞" },
    { value: BlockType.MATH, label: "Math", icon: "∑" },
    { value: BlockType.MENTION, label: "Mention", icon: "@" },
    { value: BlockType.PAGE_REFERENCE, label: "Page reference", icon: <FileText className="h-4 w-4" /> },
    { value: BlockType.DATABASE_REFERENCE, label: "Database", icon: <Database className="h-4 w-4" /> }
  ];

  const currentBlockType = blockTypeOptions.find(opt => opt.value === block.type);

  const colorOptions = [
    { name: "Default", value: null, color: "text-gray-200" },
    { name: "Gray", value: "text-gray-400", color: "text-gray-400" },
    { name: "Brown", value: "text-amber-600", color: "text-amber-600" },
    { name: "Orange", value: "text-orange-500", color: "text-orange-500" },
    { name: "Yellow", value: "text-yellow-500", color: "text-yellow-500" },
    { name: "Green", value: "text-green-500", color: "text-green-500" },
    { name: "Blue", value: "text-blue-500", color: "text-blue-500" },
    { name: "Purple", value: "text-purple-500", color: "text-purple-500" },
    { name: "Pink", value: "text-pink-500", color: "text-pink-500" },
    { name: "Red", value: "text-red-500", color: "text-red-500" }
  ];

  const backgroundColorOptions = [
    { name: "Default", value: null, bg: "bg-transparent" },
    { name: "Gray", value: "bg-gray-100", bg: "bg-gray-100" },
    { name: "Brown", value: "bg-amber-100", bg: "bg-amber-100" },
    { name: "Orange", value: "bg-orange-100", bg: "bg-orange-100" },
    { name: "Yellow", value: "bg-yellow-100", bg: "bg-yellow-100" },
    { name: "Green", value: "bg-green-100", bg: "bg-green-100" },
    { name: "Blue", value: "bg-blue-100", bg: "bg-blue-100" },
    { name: "Purple", value: "bg-purple-100", bg: "bg-purple-100" },
    { name: "Pink", value: "bg-pink-100", bg: "bg-pink-100" },
    { name: "Red", value: "bg-red-100", bg: "bg-red-100" }
  ];

  if (!isSelected) return null;

  return (
    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Drag Handle */}
      <div 
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-800/50 transition-colors"
        draggable
        onDragStart={(e) => onDragStart(e, block)}
        title="Drag to reorder"
      >
        <GripVertical className="h-3 w-3 text-gray-400" />
      </div>

      {/* Block Type Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800/50"
          >
            <span className="mr-1">{currentBlockType?.icon}</span>
            {currentBlockType?.label}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-64 bg-gray-900 border-gray-700 text-white"
        >
          <div className="p-2">
            <div className="text-xs font-medium text-gray-400 mb-2 px-2">BLOCK TYPE</div>
            <div className="grid grid-cols-2 gap-1">
              {blockTypeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onBlockTypeChange(block.id, option.value)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-gray-800 ${
                    block.type === option.value ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'
                  }`}
                >
                  <span className="w-4 text-center">{option.icon}</span>
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-0.5 bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-gray-700">
        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${block.metadata.isBold ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange(block.id, 'isBold', !block.metadata.isBold)}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3 w-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${block.metadata.isItalic ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange(block.id, 'isItalic', !block.metadata.isItalic)}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3 w-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${block.metadata.isUnderlined ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange(block.id, 'isUnderlined', !block.metadata.isUnderlined)}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-3 w-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${block.metadata.isStrikethrough ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange(block.id, 'isStrikethrough', !block.metadata.isStrikethrough)}
          title="Strikethrough"
        >
          <Strikethrough className="h-3 w-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${block.metadata.isCode ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => onFormatChange(block.id, 'isCode', !block.metadata.isCode)}
          title="Code (Ctrl+Shift+K)"
        >
          <Code className="h-3 w-3" />
        </Button>

        <div className="w-px h-4 bg-gray-600 mx-1" />

        {/* Text Alignment */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              title="Text alignment"
            >
              {block.metadata.textAlign === 'center' ? (
                <AlignCenter className="h-3 w-3" />
              ) : block.metadata.textAlign === 'right' ? (
                <AlignRight className="h-3 w-3" />
              ) : (
                <AlignLeft className="h-3 w-3" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-gray-900 border-gray-700 text-white">
            <DropdownMenuItem
              onClick={() => onFormatChange(block.id, 'textAlign', 'left')}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800"
            >
              <AlignLeft className="h-3 w-3" />
              <span>Left</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFormatChange(block.id, 'textAlign', 'center')}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800"
            >
              <AlignCenter className="h-3 w-3" />
              <span>Center</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFormatChange(block.id, 'textAlign', 'right')}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800"
            >
              <AlignRight className="h-3 w-3" />
              <span>Right</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text Color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              title="Text color"
            >
              <Palette className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-gray-900 border-gray-700 text-white">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-400 mb-2 px-2">TEXT COLOR</div>
              <div className="grid grid-cols-5 gap-1">
                {colorOptions.map((color) => (
                  <DropdownMenuItem
                    key={color.name}
                    onClick={() => onFormatChange(block.id, 'color', color.value)}
                    className={`w-6 h-6 rounded cursor-pointer flex items-center justify-center ${
                      block.metadata.color === color.value ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${color.color}`}></div>
                  </DropdownMenuItem>
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Background Color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              title="Background color"
            >
              <div className="w-3 h-3 rounded bg-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-gray-900 border-gray-700 text-white">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-400 mb-2 px-2">BACKGROUND</div>
              <div className="grid grid-cols-5 gap-1">
                {backgroundColorOptions.map((bg) => (
                  <DropdownMenuItem
                    key={bg.name}
                    onClick={() => onFormatChange(block.id, 'backgroundColor', bg.value)}
                    className={`w-6 h-6 rounded cursor-pointer flex items-center justify-center ${
                      block.metadata.backgroundColor === bg.value ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className={`w-3 h-3 rounded ${bg.bg}`}></div>
                  </DropdownMenuItem>
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-gray-600 mx-1" />

        {/* Link */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${block.metadata.link ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => {
            const url = prompt('Enter URL:', block.metadata.link || '');
            if (url !== null) {
              onFormatChange(block.id, 'link', url);
            }
          }}
          title="Add link (Ctrl+K)"
        >
          <Link className="h-3 w-3" />
        </Button>
      </div>

      {/* Block Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50"
            title="More options"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-gray-900 border-gray-700 text-white">
          <DropdownMenuItem
            onClick={() => onDuplicate(block.id)}
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800"
          >
            <Copy className="h-3 w-3" />
            <span>Duplicate</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => onAddComment(block.id)}
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800"
          >
            <MessageSquare className="h-3 w-3" />
            <span>Add comment</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <DropdownMenuItem
            onClick={() => onDelete(block.id)}
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

