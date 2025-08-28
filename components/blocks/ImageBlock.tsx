"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Image, Upload, Link, X, Loader2, AlertCircle, MoreHorizontal, Maximize2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Block, BlockMetadata } from '@/types/editor';
import { uploadImage, addExternalImage, deleteImage } from '@/actions/actions';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ImageBlockProps {
  block: Block;
  documentId: string;
  onContentChange: (blockId: string, content: string, metadata?: BlockMetadata) => void;
  onBlockDelete?: (blockId: string) => void;
}

export default function ImageBlock({ 
  block, 
  documentId, 
  onContentChange, 
  onBlockDelete 
}: ImageBlockProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [caption, setCaption] = useState(block.metadata?.caption || '');
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageWidth, setImageWidth] = useState(block.metadata?.width || 60); // percentage - default to 60% instead of 100%
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateImageWidth = useCallback((width: number) => {
    setImageWidth(width);
    onContentChange(block.id, block.content, {
      ...block.metadata,
      width: width
    });
  }, [block.id, block.content, block.metadata, onContentChange]);

  // Drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartWidth(imageWidth);
  }, [imageWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current.parentElement;
    if (!container) return;
    
    const containerWidth = container.offsetWidth;
    const deltaX = e.clientX - dragStartX;
    const deltaPercent = (deltaX / containerWidth) * 100;
    const newWidth = Math.max(20, Math.min(100, dragStartWidth + deltaPercent));
    
    setImageWidth(newWidth);
  }, [isDragging, dragStartX, dragStartWidth]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      updateImageWidth(imageWidth);
    }
  }, [isDragging, imageWidth, updateImageWidth]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user?.id) {
      toast.error('You must be logged in to upload images');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit to match bucket
      toast.error('Image file size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadImage(documentId, block.id, file, user.id);
      
      if (result.success) {
        // Update block content and metadata
        onContentChange(block.id, result.url, {
          ...block.metadata,
          mode: 'upload',
          url: result.url,
          filePath: result.filePath,
          originalFilename: file.name,
          fileSize: file.size,
          mimeType: file.type,
          caption: caption,
          width: imageWidth || 60
        });
        
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, documentId, block.id, block.metadata, caption, imageWidth, onContentChange]);

  const handleExternalUrl = useCallback(async () => {
    if (!user?.id) {
      toast.error('You must be logged in to add external images');
      return;
    }

    if (!urlInput.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?[^\s]*)?$/i;
    if (!urlPattern.test(urlInput)) {
      toast.error('Please enter a valid image URL (jpg, png, gif, webp, svg, bmp, ico)');
      return;
    }

    setIsUploading(true);
    try {
      const result = await addExternalImage(documentId, block.id, urlInput, user.id, caption);
      
      if (result.success) {
        // Update block content and metadata
        onContentChange(block.id, urlInput, {
          ...block.metadata,
          mode: 'external',
          url: urlInput,
          caption: caption,
          width: imageWidth || 60
        });
        
        setShowUrlInput(false);
        setUrlInput('');
        toast.success('External image added successfully!');
      }
    } catch (error) {
      console.error('External URL error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add external image');
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, documentId, block.id, block.metadata, urlInput, caption, imageWidth, onContentChange]);

  const handleDelete = useCallback(async () => {
    if (!user?.id) {
      toast.error('You must be logged in to delete images');
      return;
    }

    try {
      const result = await deleteImage(documentId, block.id, user.id);
      
      if (result.success) {
        // Clear the block content
        onContentChange(block.id, '', {
          ...block.metadata,
          mode: undefined,
          url: undefined,
          filePath: undefined,
          originalFilename: undefined,
          fileSize: undefined,
          mimeType: undefined,
          caption: undefined,
          width: undefined
        });
        
        toast.success('Image deleted successfully!');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete image');
    }
  }, [user?.id, documentId, block.id, block.metadata, onContentChange]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  const hasImage = block.metadata?.url;

  return (
    <div className="group relative">
      {hasImage ? (
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image Container */}
          <div 
            ref={containerRef}
            className="relative mx-auto"
            style={{ 
              width: `${Math.min(imageWidth, 100)}%`,
              maxWidth: '100%',
              minWidth: '200px'
            }}
          >
            <img 
              src={block.metadata?.url || ''} 
              alt={caption || 'Image'} 
              className="w-full h-auto max-h-96 rounded-lg shadow-sm object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                toast.error('Failed to load image');
              }}
            />
            
            {/* Hover Controls */}
            {(isHovered || isDragging || isDropdownOpen) && (
              <>
                {/* Three dots menu - positioned outside the overlay */}
                <div className="absolute top-2 right-2 z-50">
                  <DropdownMenu onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-700" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-48 z-[60]"
                      side="bottom"
                      sideOffset={4}
                    >
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateImageWidth(30); }}>
                        <div className="flex items-center justify-between w-full">
                          <span>Small</span>
                          <div className="w-4 h-2 bg-gray-400 rounded"></div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateImageWidth(50); }}>
                        <div className="flex items-center justify-between w-full">
                          <span>Medium</span>
                          <div className="w-6 h-2 bg-gray-400 rounded"></div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateImageWidth(70); }}>
                        <div className="flex items-center justify-between w-full">
                          <span>Large</span>
                          <div className="w-8 h-2 bg-gray-400 rounded"></div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateImageWidth(100); }}>
                        <div className="flex items-center justify-between w-full">
                          <span>Full width</span>
                          <div className="w-10 h-2 bg-gray-400 rounded"></div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Resize handles */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Right edge resize handle */}
                  <div 
                    className="absolute top-1/2 -right-1 w-3 h-8 bg-blue-500 rounded-full cursor-ew-resize pointer-events-auto opacity-80 hover:opacity-100 transform -translate-y-1/2 flex items-center justify-center"
                    onMouseDown={handleMouseDown}
                    title="Drag to resize"
                  >
                    <div className="w-0.5 h-4 bg-white rounded"></div>
                  </div>
                  

                </div>

                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-blue-500/5 rounded-lg pointer-events-none"></div>
              </>
            )}
          </div>
          
          {/* Caption */}
          <div className="mt-2">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="text-sm bg-transparent border-none text-gray-600 placeholder:text-gray-400 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              onBlur={() => {
                if (caption !== block.metadata?.caption) {
                  onContentChange(block.id, block.content, {
                    ...block.metadata,
                    caption: caption,
                    width: imageWidth || 60
                  });
                }
              }}
            />
          </div>
        </div>
      ) : (
        /* Empty State - Upload Options */
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <Image className="h-12 w-12 text-gray-400 mb-4" />
          <div className="text-center space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Add an image</h3>
            <p className="text-sm text-gray-500">Upload, embed with a link, or add from gallery</p>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
              
              {!showUrlInput ? (
                <Button
                  onClick={() => setShowUrlInput(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Link className="h-4 w-4" />
                  Link
                </Button>
              ) : (
                <div className="flex-1 flex gap-2">
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste image link..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleExternalUrl();
                      } else if (e.key === 'Escape') {
                        setShowUrlInput(false);
                        setUrlInput('');
                      }
                    }}
                  />
                  <Button
                    onClick={handleExternalUrl}
                    disabled={isUploading || !urlInput.trim()}
                    size="sm"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowUrlInput(false);
                      setUrlInput('');
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {!hasImage && block.content && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Invalid image URL or failed to load</span>
          </div>
        </div>
      )}
    </div>
  );
}
