"use client";

import { useState } from "react";
import { Document } from "@/types/database";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Folder, 
  ChevronRight, 
  ChevronDown,
  Copy,
  ExternalLink,
  Menu
} from "lucide-react";

import { toast } from "sonner";
import PreviewBlockRenderer from "./PreviewBlockRenderer";

interface PreviewDocumentProps {
  mainDocument: Document;
  childDocuments: Document[];
}

export default function PreviewDocument({ mainDocument, childDocuments }: PreviewDocumentProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(mainDocument?.id || '');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Safety check for mainDocument
  if (!mainDocument) {
    return (
      <div className="flex h-screen items-center justify-center mobile-safe-area mobile-vh-100">
        <div className="text-center">
          <h1 className="text-responsive-xl font-bold text-red-600 mb-2">Document Not Found</h1>
          <p className="text-responsive-sm text-gray-600">The main document is not available.</p>
        </div>
      </div>
    );
  }

  // Get the currently selected document (only if it's a document, not a folder)
  let selectedDocument = selectedDocumentId === mainDocument.id 
    ? mainDocument 
    : childDocuments.find(doc => doc.id === selectedDocumentId);
  
  // If selected item is a folder or not found, default to the first document
  if (!selectedDocument || selectedDocument.type === 'folder') {
    selectedDocument = mainDocument.type === 'document' 
      ? mainDocument 
      : childDocuments.find(doc => doc.type === 'document') || mainDocument;
  }

  // Parse blocks for the selected document
  const selectedBlocks = selectedDocument?.blocks_content && Array.isArray(selectedDocument.blocks_content)
    ? selectedDocument.blocks_content
    : selectedDocument?.content 
      ? [{ id: '1', type: 'text', content: selectedDocument.content, order: 0 }]
      : [];

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/preview/${mainDocument.preview_token}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  };

  const openInNewTab = () => {
    const shareUrl = `${window.location.origin}/preview/${mainDocument.preview_token}`;
    window.open(shareUrl, '_blank');
  };

  const selectDocument = (docId: string) => {
    // Only allow selection of documents, not folders
    const doc = docId === mainDocument.id 
      ? mainDocument 
      : childDocuments.find(d => d.id === docId);
    
    if (doc && doc.type === 'document') {
      setSelectedDocumentId(docId);
    }
  };

  // Define document with children type
  type DocumentWithChildren = Document & { children: DocumentWithChildren[] };

  // Build hierarchical document tree for sidebar
  const buildDocumentTree = (): DocumentWithChildren[] => {
    const allDocs = [mainDocument, ...childDocuments];
    const docMap = new Map<string, DocumentWithChildren>();
    
    // First pass: create map with children arrays
    allDocs.forEach(doc => {
      docMap.set(doc.id, { ...doc, children: [] });
    });

    // Second pass: build tree structure
    const roots: DocumentWithChildren[] = [];
    allDocs.forEach(doc => {
      const node = docMap.get(doc.id)!;
      if (doc.parent_id && docMap.has(doc.parent_id)) {
        const parent = docMap.get(doc.parent_id)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by order_index
    const sortNodes = (nodes: DocumentWithChildren[]) => {
      nodes.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(roots);
    return roots;
  };

  // Simple document tree renderer
  const renderSimpleDocumentTree = (docs: DocumentWithChildren[]): React.ReactNode[] => {
    return docs.map(doc => {
      const isFolder = doc.type === 'folder';
      const isExpanded = expandedFolders.has(doc.id);
      const isSelected = selectedDocumentId === doc.id;
      const hasChildren = doc.children.length > 0;

      return (
        <div key={doc.id} className="w-full">
          <div
            className={`flex items-center space-x-2 px-2 py-2 sm:py-1 rounded transition-colors ${
              isFolder 
                ? 'cursor-default' 
                : `cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    isSelected ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary' : ''
                  }`
            }`}
            onClick={() => !isFolder && selectDocument(doc.id)}
          >
            {/* Chevron for folders with children */}
            {isFolder && hasChildren ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(doc.id);
                }}
                className="p-1 hover:bg-sidebar-accent rounded cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ) : (
              <div className="w-6" />
            )}
            
            {/* Icon */}
            {isFolder ? (
              <Folder className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            
            {/* Title */}
            <span className={`flex-1 text-sm truncate text-sidebar-foreground`}>
              {doc.title}
            </span>
          </div>
          
          {/* Render children if folder is expanded */}
          {isFolder && isExpanded && hasChildren && (
            <div className="ml-6 mt-1 space-y-1">
              {doc.children.map(child => {
                const childIsFolder = child.type === 'folder';
                const childIsSelected = selectedDocumentId === child.id;
                
                return (
                  <div
                    key={child.id}
                    className={`flex items-center space-x-2 px-2 py-1 rounded transition-colors ${
                      childIsFolder 
                        ? 'cursor-default' 
                        : `cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                            childIsSelected ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary' : ''
                          }`
                    }`}
                    onClick={() => !childIsFolder && selectDocument(child.id)}
                  >
                    <div className="w-6" />
                    {childIsFolder ? (
                      <Folder className="h-3 w-3 text-primary flex-shrink-0" />
                    ) : (
                      <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`flex-1 text-xs truncate text-sidebar-foreground`}>
                      {child.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  const treeData = buildDocumentTree();

  return (
    <div className="flex h-full bg-background text-foreground relative mobile-keyboard-safe mobile-vh-100">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} transition-all duration-300 border-r border-border bg-sidebar flex flex-col fixed lg:relative inset-y-0 left-0 z-50 lg:translate-x-0 overflow-hidden`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-sidebar-foreground" />
            <h2 className="font-semibold text-sm text-sidebar-foreground">Documents</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {renderSimpleDocumentTree(treeData)}
          </div>
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs touch-target"
              onClick={copyShareLink}
            >
              <Copy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Copy Link</span>
              <span className="sm:hidden">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs touch-target"
              onClick={openInNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Open in New Tab</span>
              <span className="sm:hidden">Open</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Simple full width layout */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="flex items-center justify-between px-3 lg:px-4 py-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 mr-2"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <h1 className="text-responsive-base font-semibold text-foreground truncate">
                  {selectedDocument?.title || 'Untitled Document'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="hidden lg:flex items-center gap-1">
                    <FileText className="h-3 w-3" /> 
                    {selectedBlocks.length} blocks
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> 
                    {selectedBlocks.reduce((total, block) => total + (block.content?.split(/\s+/).length || 0), 0)} words
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Content - matching Editor.tsx layout */}
        <div className="flex-1 mobile-safe-area lg:px-8 overflow-y-auto mobile-scroll">
          {/* Spacer div to account for header */}
          <div className="h-4 shrink-0"></div>
          
          {/* Content container with proper spacing - matching Editor.tsx */}
          <div className="max-w-4xl mx-auto py-6 pb-32 px-4 sm:px-6">
            {/* Document title - matching Editor.tsx style */}
            <div className="text-center mb-4 sm:mb-6">
              <h1 className="text-responsive-2xl font-bold text-foreground leading-tight">
                {selectedDocument?.title || 'Untitled Document'}
              </h1>
            </div>
            
            {/* Blocks - matching Editor.tsx structure */}
            {selectedBlocks.length > 0 ? (
              <div className="relative min-h-screen">
                {selectedBlocks
                  .sort((a, b) => (a.order || a.orderIndex || 0) - (b.order || b.orderIndex || 0))
                  .map((block) => (
                    <div 
                      key={block.id} 
                      className="relative py-2 px-3"
                      data-type={block.type}
                    >
                      {/* Block content without symbols and hover effects */}
                      <div className="relative">
                        <PreviewBlockRenderer
                          block={block}
                          isPreview={true}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">No content available</h3>
                <p className="text-sm text-muted-foreground">
                  This document doesn&apos;t have any content to display.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}