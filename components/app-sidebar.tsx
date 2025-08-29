"use client";

import { useDocuments } from "@/hooks/use-documents";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/hooks/use-profile";
import { useRouter, useParams } from "next/navigation";
import { 
  FileText, 
  Search, 
  Plus, 
  LogOut, 
  User,
  Home,
  Inbox,
  // ChevronDown,
  // Edit3,
  FolderPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DocumentTree from "./DocumentTree";
import { DocumentNode } from "@/types/database";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export default function AppSidebar() {
  const { user, signOut } = useAuth();
  const { displayName } = useProfile();
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
      await moveDocument(docId, newParentId, user.id);
      
      // Refresh the entire document list to show the new structure
      refreshDocuments();
      
      toast.success('Document moved successfully');
    } catch (error) {
      toast.error(`Failed to move document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSharingChange = async (docId: string, isPublic: boolean, shareChildren: boolean) => {
    if (!user?.id) return;
    
    try {
      // Find the document in the current state and update it
      const updatedDocument = documents.find(doc => doc.id === docId);
      if (updatedDocument) {
        const newDoc = {
          ...updatedDocument,
          is_public: isPublic,
          share_children: shareChildren
        };
        updateDocumentInState(newDoc);
      }
      
      // Refresh documents to get the latest preview token
      refreshDocuments();
    } catch (error) {
      console.error('Error handling sharing change:', error);
    }
  };

  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">
              {displayName}&apos;s Workspace
            </span>
          </div>
          {/* <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <ChevronDown className="h-4 w-4" />
          </Button> */}
        </div>
        {/* <Button variant="ghost" size="sm" className="h-6 w-6 p-0 self-start">
          <Edit3 className="h-4 w-4" />
        </Button> */}
      </SidebarHeader>

      <SidebarContent>
        {/* Search */}
        <SidebarGroup>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <SidebarInput
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Home className="h-4 w-4" />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Inbox className="h-4 w-4" />
                <span>Inbox</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Documents Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Documents</SidebarGroupLabel>
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
          
          <SidebarGroupContent>
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
                      className="h-8 text-xs"
                    >
                      Create your first document
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleCreateFolder()}
                      className="h-8 text-xs"
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
                onSharingChange={handleSharingChange}
                currentDocumentId={currentDocumentId}
              />
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">{displayName}</span>
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
      </SidebarFooter>
    </Sidebar>
  );
}