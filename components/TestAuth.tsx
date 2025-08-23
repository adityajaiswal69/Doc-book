"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestAuth() {
  const { user, session, loading, signOut } = useAuth();

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading authentication...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user || !session) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Not Authenticated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You need to sign in to use the application.
          </p>
          <p className="text-xs text-muted-foreground">
            Make sure you have:
          </p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            <li>• Cleared your browser cookies for localhost</li>
            <li>• Created a .env.local file with Supabase credentials</li>
            <li>• Set up your Supabase database with the migration</li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Authentication Working! ✅</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">User ID:</span>
            <span className="font-mono">{user.id.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Email:</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Session:</span>
            <span className="text-green-600">Active</span>
          </div>
        </div>
        
        <Button 
          onClick={signOut} 
          variant="outline" 
          className="w-full"
        >
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
