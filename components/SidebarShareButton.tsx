"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Share2, 
  Copy, 
  ExternalLink, 
  Eye,
  Folder,
  FileText,
  X
} from "lucide-react";
import { toast } from "sonner";
import { toggleDocumentSharing } from "@/actions/actions";
import { useAuth } from "@/components/auth/AuthProvider";

interface SidebarShareButtonProps {
  documentId: string;
  title?: string;
  isPublic?: boolean;
  shareChildren?: boolean;
  previewToken?: string;
  documentType: 'document' | 'folder';
  onSharingChange?: (isPublic: boolean, shareChildren: boolean) => void;
}

export default function SidebarShareButton({
  documentId,
  title = "Untitled",
  isPublic = false,
  shareChildren = false,
  previewToken,
  documentType,
  onSharingChange
}: SidebarShareButtonProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isPublicState, setIsPublicState] = useState(isPublic);
  const [shareChildrenState, setShareChildrenState] = useState(shareChildren);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  // Reset dialog state on component mount to prevent persistence after reload
  useEffect(() => {
    setShowShareDialog(false);
  }, []);

  // Update state when props change
  useEffect(() => {
    setIsPublicState(isPublic);
    setShareChildrenState(shareChildren);
  }, [isPublic, shareChildren]);

  // Handle escape key and click outside to close dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showShareDialog) {
        setShowShareDialog(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (showShareDialog) {
        const target = e.target as Element;
        // Check if click is outside the dialog
        if (!target.closest('[data-sidebar-share-dialog]')) {
          setShowShareDialog(false);
        }
      }
    };

    if (showShareDialog) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareDialog]);

  const handleToggleSharing = async () => {
    if (!user) {
      toast.error("You must be logged in to share documents");
      return;
    }

    setIsLoading(true);
    try {
      const newIsPublic = !isPublicState;
      const newShareChildren = documentType === 'folder' ? shareChildrenState : false;
      
      await toggleDocumentSharing(documentId, newIsPublic, newShareChildren, user.id);
      
      setIsPublicState(newIsPublic);
      setShareChildrenState(newShareChildren);
      
      if (onSharingChange) {
        onSharingChange(newIsPublic, newShareChildren);
      }
      
      toast.success(newIsPublic ? "Document shared successfully!" : "Document unshared");
    } catch (error) {
      console.error('Error toggling sharing:', error);
      toast.error("Failed to update sharing settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareChildrenToggle = async () => {
    if (!user || documentType !== 'folder') return;

    setIsLoading(true);
    try {
      const newShareChildren = !shareChildrenState;
      
      await toggleDocumentSharing(documentId, isPublicState, newShareChildren, user.id);
      
      setShareChildrenState(newShareChildren);
      
      if (onSharingChange) {
        onSharingChange(isPublicState, newShareChildren);
      }
      
      toast.success(newShareChildren ? "Folder children will be shared" : "Only folder will be shared");
    } catch (error) {
      console.error('Error toggling share children:', error);
      toast.error("Failed to update sharing settings");
    } finally {
      setIsLoading(false);
    }
  };

  const copyShareLink = async () => {
    if (!previewToken) {
      toast.error("No share link available");
      return;
    }
    
    const shareUrl = `${window.location.origin}/preview/${previewToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openShareLink = () => {
    if (!previewToken) {
      toast.error("No share link available");
      return;
    }
    
    const shareUrl = `${window.location.origin}/preview/${previewToken}`;
    window.open(shareUrl, '_blank');
  };

  const shareUrl = previewToken ? `${window.location.origin}/preview/${previewToken}` : '';

  return (
    <div className="relative inline-block" data-sidebar-share-dialog>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowShareDialog(true)}
        className="h-6 w-6 p-0 hover:bg-accent"
        title="Share document"
      >
        <Share2 className="h-3 w-3" />
      </Button>

      {showShareDialog && (
        <>
          {/* Backdrop for mobile/overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-[9998] md:hidden"
            onClick={() => setShowShareDialog(false)}
          />
          
          {/* Sidebar-specific positioned dialog */}
          <div className="absolute left-full top-0 ml-2 z-[9999] w-96 max-w-[calc(100vw-320px)]">
            {/* Arrow pointing left */}
            <div className="absolute left-0 top-4 transform -translate-x-2 w-4 h-4 bg-background border-l-2 border-b-2 border-border rotate-45"></div>
            
            <Card className="w-full animate-in fade-in-0 zoom-in-95 duration-200 shadow-2xl border-2 bg-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Public sharing</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShareDialog(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-4 p-4">
                {/* Document Info */}
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                  {documentType === 'folder' ? (
                    <Folder className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-gray-500" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {documentType === 'folder' ? 'Folder' : 'Document'}
                    </span>
                  </div>
                </div>

                {/* Public Sharing Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Public sharing</Label>
                    <p className="text-xs text-muted-foreground">
                      Anyone with the link can view this {documentType}
                    </p>
                  </div>
                  <Switch
                    checked={isPublicState}
                    onCheckedChange={handleToggleSharing}
                    disabled={isLoading}
                  />
                </div>

                {/* Share Children Toggle (only for folders) */}
                {documentType === 'folder' && isPublicState && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Share children</Label>
                      <p className="text-xs text-muted-foreground">
                        Include all documents inside this folder
                      </p>
                    </div>
                    <Switch
                      checked={shareChildrenState}
                      onCheckedChange={handleShareChildrenToggle}
                      disabled={isLoading}
                    />
                  </div>
                )}

                {/* Share Link */}
                {isPublicState && shareUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Share link</Label>
                    <div className="flex gap-2 w-full">
                      <Input
                        value={shareUrl}
                        readOnly
                        className="text-xs flex-1 min-w-0 break-all"
                        onClick={(e) => {
                          e.currentTarget.select();
                          copyShareLink();
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyShareLink}
                        className={`px-3 flex-shrink-0 ${copied ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                        title={copied ? "Copied!" : "Copy link"}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openShareLink}
                        className="px-3 flex-shrink-0"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="break-words">
                    {isPublicState 
                      ? `This ${documentType} is publicly shared`
                      : `This ${documentType} is private`
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
