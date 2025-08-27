"use client";

import { useState } from "react";
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

interface ShareButtonProps {
  documentId: string;
  isPublic?: boolean;
  shareChildren?: boolean;
  previewToken?: string;
  documentType: 'document' | 'folder';
  onSharingChange?: (isPublic: boolean, shareChildren: boolean) => void;
}

export default function ShareButton({
  documentId,
  isPublic = false,
  shareChildren = false,
  previewToken,
  documentType,
  onSharingChange
}: ShareButtonProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isPublicState, setIsPublicState] = useState(isPublic);
  const [shareChildrenState, setShareChildrenState] = useState(shareChildren);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

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

  const copyShareLink = () => {
    if (!previewToken) {
      toast.error("No share link available");
      return;
    }
    
    const shareUrl = `${window.location.origin}/preview/${previewToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
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
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowShareDialog(true)}
        className="flex items-center space-x-2"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </Button>

      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Share Document</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Document Info */}
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                {documentType === 'folder' ? (
                  <Folder className="h-5 w-5 text-blue-500" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-500" />
                )}
                <span className="text-sm font-medium">
                  {documentType === 'folder' ? 'Folder' : 'Document'}
                </span>
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
                  <div className="flex space-x-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyShareLink}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openShareLink}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>
                  {isPublicState 
                    ? `This ${documentType} is publicly shared`
                    : `This ${documentType} is private`
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
