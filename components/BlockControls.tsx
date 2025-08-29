"use client";

import React from "react";
import { 
  GripVertical, 
  MoreHorizontal,
  Copy,
  MessageSquare,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,

} from "@/components/ui/dropdown-menu";
import { Block, BlockType } from "@/types/editor";

interface BlockControlsProps {
  block: Block;
  isSelected: boolean;
  isHovered?: boolean;
  onBlockTypeChange: (blockId: string, newType: BlockType) => void;
  onFormatChange: (blockId: string, format: string, value: unknown) => void;
  onDuplicate: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onAddComment: (blockId: string) => void;
  onDragStart: (e: React.DragEvent, block: Block) => void;
}

export default function BlockControls({
  block,
  isSelected,
  isHovered = false,
  onBlockTypeChange,
  onFormatChange,
  onDuplicate,
  onDelete,
  onAddComment,
  onDragStart
}: BlockControlsProps) {

  const blockTypeOptions = [
    { value: "text" as BlockType, label: "Text", icon: "T" },
    { value: "heading-1" as BlockType, label: "Heading 1", icon: "H1" },
    { value: "heading-2" as BlockType, label: "Heading 2", icon: "H2" },
    { value: "heading-3" as BlockType, label: "Heading 3", icon: "H3" },
    { value: "bulleted-list" as BlockType, label: "Bulleted list", icon: "•" },
    { value: "numbered-list" as BlockType, label: "Numbered list", icon: "1." },
    { value: "todo-list" as BlockType, label: "To-do list", icon: "☐" },
    { value: "quote" as BlockType, label: "Quote", icon: "❝" },
    { value: "code-block" as BlockType, label: "Code block", icon: "{}" },
    { value: "image" as BlockType, label: "Image", icon: <ImageIcon className="h-4 w-4" /> },
    { value: "video" as BlockType, label: "Video", icon: <VideoIcon className="h-4 w-4" /> },
    { value: "table" as BlockType, label: "Table", icon: "⊞" }
  ];

  // Always render controls, but use CSS to control visibility

  return (
    <>
      {/* Left Side: Drag Handle - Only show on hover */}
      {/* <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        
        <div 
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-800/50 transition-colors"
          draggable
          onDragStart={(e) => onDragStart(e, block)}
          title="Drag to reorder"
        >
          <GripVertical className="h-3 w-3 text-gray-400" />
        </div>
      </div> */}

      {/* Right Side: Combined Block Type + More Options (3 dots) */}
      {/* Show on hover for any block, or permanently for selected block */}
      <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full flex items-center gap-1 transition-opacity duration-200 ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded"
              title="Block options"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            side="bottom"
            sideOffset={8}
            avoidCollisions={true}
            collisionPadding={24}
            alignOffset={-200}
            className="w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-gray-900 border-gray-700 text-white z-[100] shadow-2xl rounded-lg"
          >
            {/* Block Type Section */}
            <div className="p-3">
              <div className="text-xs font-medium text-gray-400 mb-3 px-1">CHANGE TYPE</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {blockTypeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onBlockTypeChange(block.id, option.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md text-xs cursor-pointer hover:bg-gray-800 transition-colors ${
                      block.type === option.value ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:text-white'
                    }`}
                    title={option.label}
                  >
                    <span className="text-base">{option.icon}</span>
                    <span className="text-[10px] truncate w-full text-center leading-tight">{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-700"></div>

            {/* More Options Section */}
            <div className="p-2">
              <DropdownMenuItem
                onClick={() => onDuplicate(block.id)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-800 rounded-md transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span className="text-sm">Duplicate</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => onAddComment(block.id)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-800 rounded-md transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">Add comment</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-gray-700 my-2" />
              
              <DropdownMenuItem
                onClick={() => onDelete(block.id)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-red-600/10 text-red-400 hover:text-red-300 rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm">Delete</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

