'use client'

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createDocument } from "@/actions/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, User, Database } from "lucide-react";
import TestAuth from "@/components/TestAuth";

export default function HomePage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCreateDocument = () => {
    if (!user?.id) {
      alert('Please sign in to create a document');
      return;
    }

    startTransition(async () => {
      try {
        const result = await createDocument(user.id);
        console.log('Document created:', result);
        router.push(`/doc/${result.docId}`);
      } catch (error) {
        console.error('Failed to create document:', error);
        alert('Failed to create document. Please try again.');
      }
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Note Forge
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your powerful Notion alternative built with Next.js and Supabase. 
            Create, organize, and collaborate on your notes with ease.
          </p>
        </div>

        {/* Test Component */}
        <div className="mb-12">
          <TestAuth />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User ID:</span>
                  <span className="text-sm font-mono">{user?.id ? user.id.substring(0, 8) + '...' : 'Not signed in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm">{user?.email || 'Not signed in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Session:</span>
                  <span className="text-sm">{session ? 'Active' : 'No session'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Supabase URL:</span>
                  <span className="text-sm font-mono">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Service Key:</span>
                  <span className="text-sm font-mono">
                    {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Not set'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ready to Create
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Start building your knowledge base with your first document
              </p>
              <Button 
                onClick={handleCreateDocument} 
                disabled={isPending || !user}
                className="w-full"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create your first document
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Rich Text Editing
              </CardTitle>
              <CardDescription>
                Powerful text editor with real-time collaboration capabilities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-6 w-6" />
                Secure Storage
              </CardTitle>
              <CardDescription>
                Your data is safely stored in Supabase with row-level security
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
