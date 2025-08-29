"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "./app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { FileText, Lock, Share2, FileIcon, Type } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDocument } from "@/hooks/use-documents";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect, useRef } from "react";

// Component for document header when in document routes
function DocumentHeader({ documentId }: { documentId: string }) {
  const { user } = useAuth();
  const { document, saving, saveDocument } = useDocument(documentId);
  const [title, setTitle] = useState("");
  const [titleChanged, setTitleChanged] = useState(false);
  const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingTitleRef = useRef(false);

  useEffect(() => {
    if (document) {
      setTitle(document.title || "");
      setTitleChanged(false);
    }
  }, [document]);

  const handleTitleChange = (newTitle: string) => {
    if (!user) return;
    
    setTitle(newTitle);
    setTitleChanged(true);
    
    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
    }
    
    titleSaveTimeoutRef.current = setTimeout(async () => {
      if (isSavingTitleRef.current) return;
      
      try {
        isSavingTitleRef.current = true;
        await saveDocument({ title: newTitle });
        setTitleChanged(false);
      } catch (error) {
        console.error('Failed to save title:', error);
        setTitleChanged(true);
      } finally {
        isSavingTitleRef.current = false;
      }
    }, 1000);
  };

  // Get basic document stats from content
  const getDocumentStats = () => {
    if (!document?.blocks_content) return { blocks: 0, words: 0 };
    
    try {
      const blocks = Array.isArray(document.blocks_content) 
        ? document.blocks_content 
        : JSON.parse(document.blocks_content || '[]');
      
      const words = blocks.reduce((total: number, block: any) => 
        total + (block.content?.split(/\s+/).length || 0), 0
      );
      
      return { blocks: blocks.length, words };
    } catch {
      return { blocks: 0, words: 0 };
    }
  };

  const stats = getDocumentStats();

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled Document"
          className="text-responsive-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto min-w-[200px] bg-transparent touch-target"
        />
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {document?.is_public ? (
          <>
            <Share2 className="h-3 w-3" />
            <span>Public</span>
          </>
        ) : (
          <>
            <Lock className="h-3 w-3" />
            <span>Private</span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-1 sm:gap-3 ml-auto">
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <FileIcon className="h-3 w-3" /> {stats.blocks} blocks
            </span>
            <span className="flex items-center gap-1">
              <Type className="h-3 w-3" /> {stats.words} words
            </span>
          </div>
          <div>
            {saving ? 'Saving...' : titleChanged ? 'Unsaved changes' : 'All changes saved'}
          </div>
        </div>
        <div className="sm:hidden text-xs text-muted-foreground">
          {saving ? 'Saving...' : titleChanged ? 'Unsaved' : 'Saved'}
        </div>
      </div>
    </div>
  );
}

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide sidebar for preview routes
  const isPreviewRoute = pathname.startsWith('/preview/');
  
  // Check if we're on a document route
  const isDocumentRoute = pathname.startsWith('/doc/');
  const documentId = isDocumentRoute ? pathname.split('/')[2] : null;
  
  if (isPreviewRoute) {
    // For preview routes, just show the children without sidebar
    return <>{children}</>;
  }
  
  // For all other routes, show the normal layout with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/98 backdrop-blur supports-[backdrop-filter]:bg-background/98 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            {isDocumentRoute && documentId && (
              <DocumentHeader documentId={documentId} />
            )}
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
