"use client";

import { useDocument } from "@/hooks/use-documents";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";

export default function Editor() {
  const params = useParams();
  const documentId = params.id as string;
  const { document, loading, error, saving, saveDocument } = useDocument(documentId);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleChanged, setTitleChanged] = useState(false);
  const [contentChanged, setContentChanged] = useState(false);

  // Update local state when document loads
  useEffect(() => {
    if (document) {
      setTitle(document.title || "");
      setContent(document.content || "");
      setTitleChanged(false);
      setContentChanged(false);
    }
  }, [document]);

  // Auto-save title changes
  const handleTitleChange = useCallback(async (newTitle: string) => {
    setTitle(newTitle);
    setTitleChanged(true);
    
    // Debounced auto-save
    setTimeout(async () => {
      try {
        await saveDocument({ title: newTitle });
        setTitleChanged(false);
      } catch (error) {
        console.error('Failed to save title:', error);
      }
    }, 1000);
  }, [saveDocument]);

  // Auto-save content changes
  const handleContentChange = useCallback(async (newContent: string) => {
    setContent(newContent);
    setContentChanged(true);
    
    // Debounced auto-save
    setTimeout(async () => {
      try {
        await saveDocument({ content: newContent });
        setContentChanged(false);
      } catch (error) {
        console.error('Failed to save content:', error);
      }
    }, 1000);
  }, [saveDocument]);

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
    <div className="flex flex-col h-full p-6 space-y-4">
      {/* Header with title and save status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Document"
            className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {saving && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {(titleChanged || contentChanged) && !saving && (
              <>
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <span>Unsaved changes</span>
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
      </div>

      {/* Content editor */}
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing your document..."
          className="w-full h-full resize-none border-none outline-none text-lg leading-relaxed bg-transparent"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        />
      </div>

      {/* Footer with document info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
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
