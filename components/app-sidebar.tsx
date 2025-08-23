"use client";

import { useDocuments } from "@/hooks/use-documents";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Search, 
  Plus, 
  Settings, 
  LogOut, 
  User,
  Database,
  Loader2
} from "lucide-react";
import { testDatabaseConnection } from "@/actions/actions";
import { useState } from "react";

export default function AppSidebar() {
  const { user, signOut } = useAuth();
  const { documents, userRooms, loading, error, refetch } = useDocuments();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleTestConnection = async () => {
    if (!user?.id) return;
    
    setTesting(true);
    try {
      const result = await testDatabaseConnection(user.id);
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setTesting(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDocument = async () => {
    if (!user?.id) {
      alert('Please sign in to create a document');
      return;
    }

    try {
      const { createDocument } = await import('@/actions/actions');
      const result = await createDocument(user.id);
      router.push(`/doc/${result.docId}`);
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create document. Please try again.');
    }
  };

  return (
    <div className="w-80 bg-background border-r flex flex-col h-full">
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
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refetch}
                  className="mt-2"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
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
                <Button
                  key={doc.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => router.push(`/doc/${doc.id}`)}
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
              ))}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <Separator />
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Debug Info</h3>
          <div className="text-xs space-y-1">
            <div>Documents: {documents.length}</div>
            <div>User Rooms: {userRooms.length}</div>
            <div>User ID: {user?.id ? user.id.substring(0, 8) + '...' : 'None'}</div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestConnection}
            disabled={testing || !user}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Testing...
              </>
            ) : (
              <>
                <Database className="h-3 w-3 mr-1" />
                Test DB Connection
              </>
            )}
          </Button>

          {testResult && (
            <Card className="mt-2">
              <CardContent className="pt-3">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || 'No email'}
            </p>
          </div>
        </div>
        
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-red-600 hover:text-red-700"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
