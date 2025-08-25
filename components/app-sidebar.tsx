"use client";

import { useDocuments } from "@/hooks/use-documents";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Search, 
  Plus, 
  Settings, 
  LogOut, 
  User,
  Trash2,
  Menu,
  X,
  Home,
  Inbox,
  Lightbulb,
  CheckSquare,
  Users,
  Calendar,
  Send,
  HelpCircle,
  ChevronDown,
  Edit3,
  Lock,
  FolderPlus
} from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import DocumentTree from "./DocumentTree";
import { DocumentNode } from "@/types/database";

export default function AppSidebar() {
  const { user, signOut } = useAuth();
  const { 
    documents, 
    loading, 
    error, 
    refreshDocuments,
    updateDocumentInState,
    addDocumentToState,
    removeDocumentFromState
  } = useDocuments();
  const router = useRouter();
  const params = useParams();
  const currentDocumentId = params.id as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDocument = async (parentId?: string) => {
    if (!user?.id) {
      toast.error('Please sign in to create a document');
      return;
    }

    try {
      let newDoc;
      if (parentId) {
        const { createDocumentInFolder } = await import('@/actions/actions');
        const result = await createDocumentInFolder(user.id, parentId);
        newDoc = {
          id: result.docId,
          title: "Untitled Document",
          content: "",
          type: "document" as const,
          parent_id: parentId,
          order_index: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } else {
        const { createDocument } = await import('@/actions/actions');
        const result = await createDocument(user.id);
        newDoc = {
          id: result.docId,
          title: "Untitled Document",
          content: "",
          type: "document" as const,
          parent_id: null,
          order_index: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // Add to local state immediately for real-time update
      addDocumentToState(newDoc);
      
      router.push(`/doc/${newDoc.id}`);
      toast.success('Document created successfully');
      
      // Close mobile sidebar after creating document
      if (isMobile) {
        setIsMobileOpen(false);
      }
    } catch (error) {
      console.error('Failed to create document:', error);
      toast.error('Failed to create document. Please try again.');
    }
  };

  const handleCreateFolder = async (parentId?: string) => {
    if (!user?.id) {
      toast.error('Please sign in to create a folder');
      return;
    }

    try {
      const { createFolder } = await import('@/actions/actions');
      const result = await createFolder(user.id, parentId);
      
      // Create the folder object for local state
      const newFolder = {
        id: result.folderId,
        title: "Untitled Folder",
        content: "",
        type: "folder" as const,
        parent_id: parentId || null,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to local state immediately for real-time update
      addDocumentToState(newFolder);
      
      toast.success('Folder created successfully');
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('Failed to create folder. Please try again.');
    }
  };

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (!user?.id) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete "${docTitle}"? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    try {
      const { deleteDocument } = await import('@/actions/actions');
      await deleteDocument(docId, user.id);
      
      // Remove from local state immediately for real-time update
      removeDocumentFromState(docId);
      
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRenameDocument = async (docId: string, newTitle: string) => {
    if (!user?.id) return;
    
    try {
      const { renameDocument } = await import('@/actions/actions');
      const result = await renameDocument(docId, newTitle, user.id);
      
      // Update local state immediately for real-time update
      updateDocumentInState(result.document);
      
      toast.success('Document renamed successfully');
    } catch (error) {
      toast.error(`Failed to rename document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleMoveDocument = async (docId: string, newParentId: string | null) => {
    if (!user?.id) return;
    
    try {
      const { moveDocument } = await import('@/actions/actions');
      const result = await moveDocument(docId, newParentId, user.id);
      
      // Refresh the entire document list to show the new structure
      refreshDocuments();
      
      toast.success('Document moved successfully');
    } catch (error) {
      toast.error(`Failed to move document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleShareDocument = async (docId: string, scope: 'document' | 'folder') => {
    if (!user?.id) {
      toast.error('Please sign in to share documents');
      return;
    }

    try {
      const { createPublicShare } = await import('@/actions/actions');
      const result = await createPublicShare(docId, user.id, scope);
      
      // Refresh documents to show updated sharing status
      refreshDocuments();
      
      // Copy share link to clipboard
      const shareUrl = `${window.location.origin}/share/${result.shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast.success(`Document shared successfully! Share link copied to clipboard.`);
    } catch (error) {
      toast.error(`Failed to share document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRevokeShare = async (docId: string) => {
    if (!user?.id) {
      toast.error('Please sign in to manage shares');
      return;
    }

    try {
      const { revokePublicShare } = await import('@/actions/actions');
      await revokePublicShare(docId, user.id);
      
      // Refresh documents to show updated sharing status
      refreshDocuments();
      
      toast.success('Document sharing revoked successfully');
    } catch (error) {
      toast.error(`Failed to revoke share: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const sidebarContent = (
    <div className="bg-background border-r flex flex-col h-full w-64">
      {/* User Profile Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">
              {user?.user_metadata?.full_name || 'User'}'s
            </span>
            <span className="font-medium text-sm">Workspace</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Edit3 className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3 border-b">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start h-8">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-8">
            <Inbox className="h-4 w-4 mr-2" />
            Inbox
          </Button>
        </div>
      </div>

      {/* Documents Section */}
      <div className="flex-1 p-3 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
              Documents
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCreateFolder()}
                className="h-6 w-6 p-0 hover:bg-accent"
                title="Create folder"
              >
                <FolderPlus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCreateDocument()}
                className="h-6 w-6 p-0 hover:bg-accent"
                title="Create document"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            </div>
          ) : error ? (
            <div className="text-xs text-red-500 px-2">{error}</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">
                {searchQuery ? 'No documents found' : 'No documents yet'}
              </p>
              {!searchQuery && (
                <div className="flex flex-col gap-2 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCreateDocument()}
                    className="h-6 text-xs"
                  >
                    Create your first document
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCreateFolder()}
                    className="h-6 text-xs"
                  >
                    Create your first folder
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <DocumentTree
              documents={filteredDocuments as DocumentNode[]}
              onCreateDocument={handleCreateDocument}
              onCreateFolder={handleCreateFolder}
              onDeleteDocument={handleDeleteDocument}
              onRenameDocument={handleRenameDocument}
              onMoveDocument={handleMoveDocument}
              onShareDocument={handleShareDocument}
              onRevokeShare={handleRevokeShare}
              currentDocumentId={currentDocumentId}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start h-8">
            <Lightbulb className="h-4 w-4 mr-2" />
            Welcome to Note Forge!
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-8">
            <CheckSquare className="h-4 w-4 mr-2" />
            Habit Tracker
          </Button>
        </div>
      </div>

      {/* Shared Section */}
      <div className="p-3 border-t">
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Shared
          </h3>
          <Button variant="ghost" size="sm" className="w-full justify-start h-8">
            <Plus className="h-4 w-4 mr-2" />
            Start collaborating
          </Button>
        </div>
      </div>

      {/* Settings & Tools */}
      <div className="p-3 border-t">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start h-8">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-8">
            <FileText className="h-4 w-4 mr-2" />
            Marketplace
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-8">
            <Trash2 className="h-4 w-4 mr-2" />
            Trash
          </Button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start h-8">
            <Users className="h-4 w-4 mr-2" />
            Invite members
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Calendar className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Send className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">{user?.user_metadata?.full_name || 'User'}</span>
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          {user?.email}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={signOut}
          className="w-full justify-start h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-3 w-3 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  // Mobile toggle button
  const mobileToggle = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsMobileOpen(!isMobileOpen)}
      className="lg:hidden fixed top-4 left-4 z-50 bg-background border shadow-lg"
    >
      {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {mobileToggle}
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] z-50">
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return sidebarContent;
}
