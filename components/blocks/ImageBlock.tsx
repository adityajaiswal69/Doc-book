"use client";

import { useState, useRef, useCallback } from 'react';
import { Image, Upload, Link, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Block, BlockMetadata } from '@/types/editor';
import { uploadImage, addExternalImage, deleteImage } from '@/actions/actions';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

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
  const [altText, setAltText] = useState(block.metadata?.alt || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user?.id) {
      toast.error('You must be logged in to upload images');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image file size must be less than 10MB');
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
          alt: altText
        });
        
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, documentId, block.id, block.metadata, altText, onContentChange]);

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
      const result = await addExternalImage(documentId, block.id, urlInput, user.id, altText);
      
      if (result.success) {
        // Update block content and metadata
        onContentChange(block.id, urlInput, {
          ...block.metadata,
          mode: 'external',
          url: urlInput,
          alt: altText
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
  }, [user?.id, documentId, block.id, block.metadata, urlInput, altText, onContentChange]);

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
          alt: undefined
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
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-400">
            {block.metadata?.mode === 'upload' ? 'Uploaded Image' : 'External Image'}
          </span>
        </div>
        
        {hasImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
            title="Delete image"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Image Display */}
      {hasImage && (
        <div className="mb-4">
          <div className="relative group">
                         <img 
               src={block.metadata?.url || ''} 
               alt={altText || 'Image'} 
               className="max-w-full h-auto max-h-96 mx-auto rounded border border-gray-600"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 toast.error('Failed to load image');
               }}
             />
            
                         {/* Image overlay with info */}
             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center">
               <div className="text-white text-center p-4">
                 <div className="text-sm">
                   {block.metadata?.mode === 'upload' ? (
                     <>
                       <div>📁 {block.metadata?.originalFilename}</div>
                       <div>📏 {((block.metadata?.fileSize || 0) / 1024 / 1024).toFixed(2)} MB</div>
                     </>
                   ) : (
                     <div className="flex items-center gap-1"><Link className="h-3 w-3" /> External URL</div>
                   )}
                 </div>
               </div>
             </div>
          </div>
          
          {/* Alt text input */}
          <div className="mt-3">
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Alt text for accessibility..."
              className="text-sm bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              onBlur={() => {
                if (altText !== block.metadata?.alt) {
                  onContentChange(block.id, block.content, {
                    ...block.metadata,
                    alt: altText
                  });
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Upload/Add Options */}
      {!hasImage && (
        <div className="space-y-4">
          {/* File Upload */}
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-white mb-2">Upload Image</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Upload an image file from your device
                </p>
                
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
                  className="w-full"
                  variant="outline"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* External URL */}
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">or</div>
            
            {!showUrlInput ? (
              <Button
                onClick={() => setShowUrlInput(true)}
                variant="ghost"
                className="text-blue-400 hover:text-blue-300"
              >
                <Link className="h-4 w-4 mr-2" />
                Add External URL
              </Button>
            ) : (
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="text-sm bg-gray-600 border-gray-500 text-white placeholder:text-gray-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleExternalUrl();
                        } else if (e.key === 'Escape') {
                          setShowUrlInput(false);
                          setUrlInput('');
                        }
                      }}
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleExternalUrl}
                        disabled={isUploading || !urlInput.trim()}
                        size="sm"
                        className="flex-1"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Image'
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
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
