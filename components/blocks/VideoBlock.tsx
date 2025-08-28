"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Video, Upload, Link, X, Loader2, AlertCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Card components removed as they're not used
import { Block, BlockMetadata } from '@/types/editor';
import { uploadVideo, addExternalVideo, deleteVideo } from '@/actions/actions';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoBlockProps {
  block: Block;
  documentId: string;
  onContentChange: (blockId: string, content: string, metadata?: BlockMetadata) => void;
  onBlockDelete?: (blockId: string) => void;
}

export default function VideoBlock({ 
  block, 
  documentId, 
  onContentChange 
}: VideoBlockProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [caption, setCaption] = useState(block.metadata?.caption || '');
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [videoWidth, setVideoWidth] = useState(block.metadata?.width || 60); // percentage - default to 60% instead of 100%
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateVideoWidth = useCallback((width: number) => {
    setVideoWidth(width);
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
    setDragStartWidth(videoWidth);
  }, [videoWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current.parentElement;
    if (!container) return;
    
    const containerWidth = container.offsetWidth;
    const deltaX = e.clientX - dragStartX;
    const deltaPercent = (deltaX / containerWidth) * 100;
    const newWidth = Math.max(20, Math.min(100, dragStartWidth + deltaPercent));
    
    setVideoWidth(newWidth);
  }, [isDragging, dragStartX, dragStartWidth]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      updateVideoWidth(videoWidth);
    }
  }, [isDragging, videoWidth, updateVideoWidth]);

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
      toast.error('You must be logged in to upload videos');
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) { // 500MB limit for videos
      toast.error('Video file size must be less than 500MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadVideo(documentId, block.id, file, user.id);
      
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
          width: videoWidth || 60
        });
        
        toast.success('Video uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, documentId, block.id, block.metadata, caption, videoWidth, onContentChange]);

  const handleExternalUrl = useCallback(async () => {
    if (!user?.id) {
      toast.error('You must be logged in to add external videos');
      return;
    }

    if (!urlInput.trim()) {
      toast.error('Please enter a valid video URL');
      return;
    }

    // Support for various video formats and embed URLs
    const videoUrlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*\.(mp4|mov|avi|mkv|webm|m4v|flv|wmv|ogv)(\?[^\s]*)?$/i;
    const embedPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|dailymotion\.com\/video\/|twitch\.tv\/videos\/|facebook\.com\/.*\/videos\/)/i;
    
    if (!videoUrlPattern.test(urlInput) && !embedPattern.test(urlInput)) {
      toast.error('Please enter a valid video URL or embed link (YouTube, Vimeo, etc.)');
      return;
    }

    setIsUploading(true);
    try {
      const result = await addExternalVideo(documentId, block.id, urlInput, user.id, caption);
      
      if (result.success) {
        // Update block content and metadata
        onContentChange(block.id, urlInput, {
          ...block.metadata,
          mode: 'external',
          url: urlInput,
          caption: caption,
          width: videoWidth || 60,
          isEmbed: embedPattern.test(urlInput)
        });
        
        setShowUrlInput(false);
        setUrlInput('');
        toast.success('External video added successfully!');
      }
    } catch (error) {
      console.error('External URL error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add external video');
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, documentId, block.id, block.metadata, urlInput, caption, videoWidth, onContentChange]);

  const handleDelete = useCallback(async () => {
    if (!user?.id) {
      toast.error('You must be logged in to delete videos');
      return;
    }

    try {
      const result = await deleteVideo(documentId, block.id, user.id);
      
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
          width: undefined,
          isEmbed: undefined
        });
        
        toast.success('Video deleted successfully!');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete video');
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

  // Function to get embed iframe for popular video platforms
  const getEmbedHtml = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // For other URLs, return the original URL
    return url;
  };

  const hasVideo = block.metadata?.url;
  const isEmbed = block.metadata?.isEmbed;

  return (
    <div className="group relative">
      {hasVideo ? (
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Video Container */}
          <div 
            ref={containerRef}
            className="relative mx-auto"
            style={{ 
              width: `${Math.min(videoWidth, 100)}%`,
              maxWidth: '100%',
              minWidth: '200px'
            }}
          >
            {isEmbed ? (
              <iframe 
                src={getEmbedHtml(block.metadata?.url || '')}
                className="w-full aspect-video rounded-lg shadow-sm"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={caption || 'Video'}
              />
            ) : (
              <video 
                src={block.metadata?.url || ''} 
                className="w-full h-auto max-h-96 rounded-lg shadow-sm object-contain"
                controls
                preload="metadata"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  toast.error('Failed to load video');
                }}
              >
                Your browser does not support the video tag.
              </video>
            )}
            
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
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateVideoWidth(30); }}>
                        <div className="flex items-center justify-between w-full">
                          <span>Small</span>
                          <div className="w-4 h-2 bg-gray-400 rounded"></div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateVideoWidth(50); }}>
                        <div className="flex items-center justify-between w-full">
                          <span>Medium</span>
                          <div className="w-6 h-2 bg-gray-400 rounded"></div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateVideoWidth(70); }}>
                        <div className="flex items-center justify-between w-full">
                          <span>Large</span>
                          <div className="w-8 h-2 bg-gray-400 rounded"></div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateVideoWidth(100); }}>
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
                    width: videoWidth || 60
                  });
                }
              }}
            />
          </div>
        </div>
      ) : (
        /* Empty State - Upload Options */
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <Video className="h-12 w-12 text-gray-400 mb-4" />
          <div className="text-center space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Add a video</h3>
            <p className="text-sm text-gray-500">Upload, embed with a link from YouTube, Vimeo, or other platforms</p>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
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
                    placeholder="Paste video link or embed URL..."
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
      {!hasVideo && block.content && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Invalid video URL or failed to load</span>
          </div>
        </div>
      )}
    </div>
  );
}
