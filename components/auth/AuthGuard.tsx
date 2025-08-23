"use client";

import { useAuth } from "./AuthProvider";
import AuthForm from "./AuthForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, session } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Welcome to Note Forge</h1>
            <p className="text-xl text-muted-foreground">
              Your Notion alternative built with Next.js and Supabase
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
