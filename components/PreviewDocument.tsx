"use client";

import { useState } from "react";
import { Document } from "@/types/database";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Folder, 
  ChevronRight, 
  ChevronDown,
  Eye,
  Copy,
  ExternalLink,
  Menu,
  X
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

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



  // Get the currently selected document
  const selectedDocument = selectedDocumentId === mainDocument.id 
    ? mainDocument 
    : childDocuments.find(doc => doc.id === selectedDocumentId);

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

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const selectDocument = (docId: string) => {
    setSelectedDocumentId(docId);
    setIsMobileSidebarOpen(false); // Close mobile sidebar when selecting a document
  };

  // Group child documents by parent (for folder structure)
  const documentsByParent = childDocuments.reduce((acc, doc) => {
    const parentId = doc.parent_id || 'root';
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderDocumentTree = (docs: Document[], parentId: string | null = null) => {
    return docs
      .filter(doc => doc.parent_id === parentId)
      .sort((a, b) => a.order_index - b.order_index)
      .map(doc => {
        const isFolder = doc.type === 'folder';
        const isExpanded = expandedFolders.has(doc.id);
        const isSelected = selectedDocumentId === doc.id;
        const hasChildren = documentsByParent[doc.id]?.length > 0;

        return (
          <div key={doc.id} className="w-full">
            <div
              className={`flex items-center space-x-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => selectDocument(doc.id)}
            >
              {isFolder ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(doc.id);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              
              {isFolder ? (
                <Folder className="h-4 w-4 text-blue-500" />
              ) : (
                <FileText className="h-4 w-4 text-gray-500" />
              )}
              
              <span className="flex-1 text-sm truncate">{doc.title}</span>
            </div>
            
            {isFolder && isExpanded && hasChildren && (
              <div className="ml-6">
                {renderDocumentTree(documentsByParent[doc.id] || [], doc.id)}
              </div>
            )}
          </div>
        );
      });
  };

  // Render all documents in a flat list for preview
  const renderAllDocuments = () => {
    const allDocs = [mainDocument, ...childDocuments];
    return allDocs.map(doc => {
      const isFolder = doc.type === 'folder';
      const isSelected = selectedDocumentId === doc.id;

      return (
        <div key={doc.id} className="w-full">
                      <div
              className={`flex items-center space-x-2 px-2 py-2 sm:py-1 rounded cursor-pointer hover:bg-gray-800 active:bg-gray-700 transition-colors ${
                isSelected ? 'bg-blue-900/20 border-l-2 border-blue-500' : ''
              }`}
              onClick={() => selectDocument(doc.id)}
            >
              <div className="w-6" />
              
              {isFolder ? (
                <Folder className="h-4 w-4 text-blue-400 flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              
              <span className="flex-1 text-sm truncate text-white">{doc.title}</span>
            </div>
        </div>
      );
    });
  };

  return (
    <div className="flex h-full bg-black text-white relative mobile-keyboard-safe mobile-vh-100">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        w-64 border-r border-gray-800 bg-gray-900 flex flex-col
        fixed lg:relative inset-y-0 left-0 z-50 
        transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition-transform duration-200 ease-in-out
      `}>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <h2 className="font-semibold text-sm text-white">Shared Documents</h2>
            </div>
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-1 hover:bg-gray-800 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            {mainDocument.share_children ? 'Folder shared' : 'Document shared'}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {renderAllDocuments()}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 text-xs touch-target"
              onClick={copyShareLink}
            >
              <Copy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Copy Link</span>
              <span className="sm:hidden">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 text-xs touch-target"
              onClick={openInNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Open in New Tab</span>
              <span className="sm:hidden">Open</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-black lg:ml-0">
        {/* Header - matching Editor.tsx style */}
        <div className="border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60 flex-shrink-0">
          <div className="flex items-center justify-between px-3 lg:px-4 py-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileSidebar}
                className="lg:hidden p-2 hover:bg-gray-800 rounded mr-2 flex-shrink-0 touch-target"
              >
                <Menu className="h-5 w-5 text-gray-400" />
              </button>
              
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <h1 className="text-responsive-base font-semibold text-white truncate">
                  {selectedDocument?.title || 'Untitled Document'}
                </h1>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <Eye className="h-3 w-3" />
                <span>Preview Mode</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden md:flex items-center gap-4 text-xs text-gray-400">
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
                <div className="hidden lg:block">Read-only preview</div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Content - matching Editor.tsx layout */}
        <div className="flex-1 mobile-safe-area lg:px-8 overflow-y-auto min-h-0 bg-black mobile-scroll">
          <div className="max-w-4xl mx-auto py-4 sm:py-6 pb-16 sm:pb-20 mobile-safe-bottom">
            {/* Document title - matching Editor.tsx style */}
            <div className="text-center mb-4 sm:mb-6">
              <h1 className="text-responsive-2xl font-bold mb-3 text-white leading-tight">
                {selectedDocument?.title || 'Untitled Document'}
              </h1>
            </div>
            
            {/* Blocks */}
            {selectedBlocks.length > 0 ? (
              <div className="">
                {selectedBlocks
                  .sort((a, b) => (a.order || a.orderIndex || 0) - (b.order || b.orderIndex || 0))
                  .map((block) => (
                    <div key={block.id} className="py-1 px-1 sm:px-2 rounded-lg">
                      <PreviewBlockRenderer
                        block={block}
                        isPreview={true}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-400 px-4">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">No content available</h3>
                <p className="text-sm text-gray-400">
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
