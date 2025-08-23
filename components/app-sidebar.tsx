"use client";

import { useDocuments } from "@/hooks/use-documents";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
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
  X
} from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export default function AppSidebar() {
  const { user, signOut } = useAuth();
  const { documents, loading, error, refetch } = useDocuments();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDocument = async () => {
    if (!user?.id) {
      toast.error('Please sign in to create a document');
      return;
    }

    try {
      const { createDocument } = await import('@/actions/actions');
      const result = await createDocument(user.id);
      router.push(`/doc/${result.docId}`);
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

  const handleDocumentClick = (docId: string) => {
    router.push(`/doc/${docId}`);
    // Close mobile sidebar after clicking document
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (!user?.id) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete "${docTitle}"? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    try {
      const { deleteDocument } = await import('@/actions/actions');
      await deleteDocument(docId, user.id);
      toast.success('Document deleted successfully');
      refetch(); // Refresh the documents list
    } catch (error) {
      toast.error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const sidebarContent = (
    <div className="bg-background border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Note Forge</h1>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create Document Button */}
        <Button 
          onClick={handleCreateDocument}
          className="w-full"
          disabled={!user}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>

        {/* Documents List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Documents</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            </div>
          ) : error ? (
            <div className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <div className="pt-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refetch}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No documents found' : 'No documents yet'}
              </p>
              {!searchQuery && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCreateDocument}
                  className="mt-2"
                >
                  Create your first document
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="group relative">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 pr-12"
                    onClick={() => handleDocumentClick(doc.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium truncate w-full">
                        {doc.title || 'Untitled Document'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {doc.updated_at 
                          ? new Date(doc.updated_at).toLocaleDateString()
                          : 'Never updated'
                        }
                      </span>
                    </div>
                  </Button>
                  
                  {/* Delete button - appears on hover */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc.id, doc.title || 'Untitled Document');
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{user?.user_metadata?.full_name || 'User'}</span>
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            {user?.email}
          </div>
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start"
            >
              <Settings className="h-3 w-3 mr-2" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
            >
              <LogOut className="h-3 w-3 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
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
