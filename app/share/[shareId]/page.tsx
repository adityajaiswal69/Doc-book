"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSharedDocument, getSharedFolderContents } from "@/actions/actions";
import { Document as DocumentType, PublicShare } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Folder, ExternalLink, Eye, Calendar, Users, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import Document from "@/components/Document";
import { formatDistanceToNow } from "date-fns";

interface SharedDocumentData {
  document: DocumentType;
  share: PublicShare;
  children: DocumentType[];
}

export default function SharePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [sharedData, setSharedData] = useState<SharedDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [currentFolderContents, setCurrentFolderContents] = useState<DocumentType[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DocumentType | null>(null);

  useEffect(() => {
    const fetchSharedDocument = async () => {
      try {
        setLoading(true);
        const result = await getSharedDocument(shareId);
        
        // Handle the response structure from getSharedDocument
        if (result.success) {
          setSharedData({
            document: result.document,
            share: result.share,
            children: result.children
          });
          
          // If it's a document (not a folder), set it as selected
          if (result.document.type === 'document') {
            setSelectedDocument(result.document);
          }
        } else {
          throw new Error('Failed to load shared content');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load shared content';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedDocument();
    }
  }, [shareId]);

  const handleDocumentClick = async (document: DocumentType) => {
    if (document.type === 'document') {
      setSelectedDocument(document);
      setCurrentFolder(null);
      setCurrentFolderContents([]);
    } else if (document.type === 'folder') {
      try {
        // Fetch folder contents
        const result = await getSharedFolderContents(document.id, shareId);
        if (result.success) {
          setCurrentFolder(document);
          setCurrentFolderContents(result.children);
          setSelectedDocument(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load folder contents';
        toast.error(errorMessage);
      }
    }
  };

  const goBackToRoot = () => {
    setCurrentFolder(null);
    setCurrentFolderContents([]);
    setSelectedDocument(null);
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'This shared content is no longer available or has been removed.'}
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { document, share, children } = sharedData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {document.type === 'folder' ? (
                <Folder className="h-6 w-6 text-blue-500" />
              ) : (
                <FileText className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <h1 className="text-xl font-semibold">{document.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {document.type === 'folder' ? 'Shared Folder' : 'Shared Document'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyShareLink}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700 dark:text-blue-300">
                  {share.view_count} view{share.view_count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700 dark:text-blue-300">
                  Shared {formatDistanceToNow(new Date(share.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 dark:text-blue-300">View-only access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {document.type === 'folder' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Folder Contents */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-blue-500" />
                      {currentFolder ? currentFolder.title : 'Contents'}
                    </CardTitle>
                    {currentFolder && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goBackToRoot}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {(currentFolder ? currentFolderContents : children).length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {currentFolder ? 'This folder is empty.' : 'This folder is empty.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(currentFolder ? currentFolderContents : children).map((child) => (
                        <div
                          key={child.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedDocument?.id === child.id
                              ? 'bg-accent border-accent-foreground/20'
                              : 'hover:bg-accent/50 border-transparent'
                          }`}
                          onClick={() => handleDocumentClick(child)}
                        >
                          {child.type === 'folder' ? (
                            <Folder className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{child.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {child.type === 'folder' ? 'Folder' : 'Document'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Document Viewer */}
            <div className="lg:col-span-2">
              {selectedDocument ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      {selectedDocument.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Document
                      documentId={selectedDocument.id}
                      initialContent={selectedDocument.content}
                      initialBlocksContent={selectedDocument.blocks_content}
                      isReadOnly={true}
                    />
                  </CardContent>
                </Card>
              ) : currentFolder ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-blue-500" />
                      {currentFolder.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentFolderContents.length === 0 ? (
                      <div className="text-center py-8">
                        <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">This folder is empty.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentFolderContents.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
                            onClick={() => handleDocumentClick(child)}
                          >
                            {child.type === 'folder' ? (
                              <Folder className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{child.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {child.type === 'folder' ? 'Folder' : 'Document'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Select a document from the folder to view its contents.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Single Document View */
          <Card>
            <CardContent className="p-0">
              <Document
                documentId={document.id}
                initialContent={document.content}
                initialBlocksContent={document.blocks_content}
                isReadOnly={true}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
