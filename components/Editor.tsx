"use client";

import { useDocument } from "@/hooks/use-documents";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export default function Editor() {
  const params = useParams();
  const documentId = params.id as string;
  const { user } = useAuth();
  const { document, loading, error, saving, saveDocument } = useDocument(documentId);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleChanged, setTitleChanged] = useState(false);
  const [contentChanged, setContentChanged] = useState(false);
  
  // Refs to store timeout IDs for debouncing
  const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to track if we're currently saving to prevent double-saves
  const isSavingTitleRef = useRef(false);
  const isSavingContentRef = useRef(false);

  // Update local state when document loads (only on initial load or document change)
  useEffect(() => {
    if (document && !titleChanged && !contentChanged) {
      setTitle(document.title || "");
      setContent(document.content || "");
      setTitleChanged(false);
      setContentChanged(false);
    }
  }, [document?.id]); // Only depend on document ID, not the entire document object

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
      if (contentSaveTimeoutRef.current) clearTimeout(contentSaveTimeoutRef.current);
    };
  }, []);

  // Auto-save title changes with improved debouncing
  const handleTitleChange = useCallback(async (newTitle: string) => {
    setTitle(newTitle);
    setTitleChanged(true);
    
    // Clear existing timeout
    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    titleSaveTimeoutRef.current = setTimeout(async () => {
      if (isSavingTitleRef.current) return; // Prevent double-saves
      
      try {
        isSavingTitleRef.current = true;
        await saveDocument({ title: newTitle });
        setTitleChanged(false);
      } catch (error) {
        console.error('Failed to save title:', error);
        // Keep the changed state if save failed
        setTitleChanged(true);
      } finally {
        isSavingTitleRef.current = false;
      }
    }, 1500); // Increased debounce time for smoother experience
  }, [saveDocument]);

  // Auto-save content changes with improved debouncing
  const handleContentChange = useCallback(async (newContent: string) => {
    setContent(newContent);
    setContentChanged(true);
    
    // Clear existing timeout
    if (contentSaveTimeoutRef.current) {
      clearTimeout(contentSaveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    contentSaveTimeoutRef.current = setTimeout(async () => {
      if (isSavingContentRef.current) return; // Prevent double-saves
      
      try {
        isSavingContentRef.current = true;
        await saveDocument({ content: newContent });
        setContentChanged(false);
      } catch (error) {
        console.error('Failed to save content:', error);
        // Keep the changed state if save failed
        setContentChanged(true);
      } finally {
        isSavingContentRef.current = false;
      }
    }, 2000); // Increased debounce time for smoother experience
  }, [saveDocument]);

  // Manual save function for immediate saving
  const handleManualSave = useCallback(async () => {
    try {
      await saveDocument({ title, content });
      setTitleChanged(false);
      setContentChanged(false);
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  }, [saveDocument, title, content]);

  // Keyboard shortcut for saving (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (titleChanged || contentChanged) {
          handleManualSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave, titleChanged, contentChanged]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading document...</span>
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
    <div className="flex flex-col h-full p-3 sm:p-6 space-y-3 sm:space-y-4">
      {/* Header with title and save status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Document"
            className="text-xl sm:text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          {saving && (
            <>
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {(titleChanged || contentChanged) && !saving && (
            <>
              <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Auto-saving in {contentSaveTimeoutRef.current ? '2s' : titleSaveTimeoutRef.current ? '1.5s' : 'soon'}...</span>
              <Button 
                onClick={handleManualSave}
                size="sm"
                variant="outline"
                className="ml-2 h-6 px-2 text-xs"
              >
                Save Now
              </Button>
            </>
          )}
          {!titleChanged && !contentChanged && !saving && (
            <>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>All changes saved</span>
            </>
          )}
        </div>
      </div>

      {/* Content editor */}
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing your document..."
          className="w-full h-full resize-none border-none outline-none text-base sm:text-lg leading-relaxed bg-transparent p-0"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        />
      </div>

      {/* Footer with document info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-muted-foreground border-t pt-3 sm:pt-4 gap-2 sm:gap-0">
        <div>
          Last saved: {document.updated_at ? new Date(document.updated_at).toLocaleString() : 'Never'}
        </div>
        <div>
          Document ID: {document.id.substring(0, 8)}...
        </div>
      </div>
    </div>
  );
}
