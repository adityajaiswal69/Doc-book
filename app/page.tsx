'use client'

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createDocument } from "@/actions/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, User, Database, Sparkles, Zap, Shield } from "lucide-react";
import TestAuth from "@/components/TestAuth";
import { toast } from "sonner";

export default function HomePage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCreateDocument = () => {
    if (!user?.id) {
      toast.error('Please sign in to create a document');
      return;
    }

    startTransition(async () => {
      try {
        const result = await createDocument(user.id);
        console.log('Document created:', result);
        toast.success('Document created successfully!');
        router.push(`/doc/${result.docId}`);
      } catch (error) {
        console.error('Failed to create document:', error);
        toast.error('Failed to create document. Please try again.');
      }
    });
  };

  if (!user) {
    return <TestAuth />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-4xl w-full space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Note Forge
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personal workspace for notes, ideas, and collaboration. 
            Create, organize, and share your thoughts effortlessly.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={handleCreateDocument}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold">New Document</h3>
              <p className="text-sm text-muted-foreground">Start with a blank canvas</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold">AI Templates</h3>
              <p className="text-sm text-muted-foreground">Smart document starters</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold">Quick Notes</h3>
              <p className="text-sm text-muted-foreground">Capture ideas instantly</p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Secure & Private
              </CardTitle>
              <CardDescription>
                Your notes are encrypted and private by default
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                Real-time Sync
              </CardTitle>
              <CardDescription>
                Changes sync instantly across all your devices
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Create Button */}
        <div className="text-center">
          <Button 
            onClick={handleCreateDocument}
            size="lg"
            className="h-12 px-8 text-lg"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Document
              </>
            )}
          </Button>
        </div>

        {/* User Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Welcome back, <span className="font-medium text-foreground">{user.user_metadata?.full_name || user.email}</span></p>
        </div>
      </div>
    </div>
  );
}
