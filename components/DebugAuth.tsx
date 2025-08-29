"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { testDatabaseConnection } from "@/actions/actions";
import { useState } from "react";

export default function DebugAuth() {
  const { user, session, loading } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    if (!user?.id) {
      setTestResult({ error: 'No user ID available' });
      return;
    }

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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Debug Info</CardTitle>
        <CardDescription>
          Current authentication and session state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Loading:</span>
            <span className="ml-2">{loading ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="font-medium">User ID:</span>
            <span className="ml-2 font-mono">
              {user?.id ? user.id.substring(0, 8) + '...' : 'None'}
            </span>
          </div>
          <div>
            <span className="font-medium">Email:</span>
            <span className="ml-2">{user?.email || 'None'}</span>
          </div>
          <div>
            <span className="font-medium">Session:</span>
            <span className="ml-2">{session ? 'Active' : 'None'}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <Button 
            onClick={handleTestConnection} 
            disabled={testing || !user}
            className="w-full"
          >
            {testing ? 'Testing...' : 'Test Database Connection'}
          </Button>
        </div>

        {testResult && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Test Result:</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Environment Variables:</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="font-medium">SUPABASE_URL:</span>
              <span className="ml-2 font-mono">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}
              </span>
            </div>
            <div>
              <span className="font-medium">SERVICE_ROLE_KEY:</span>
              <span className="ml-2 font-mono">
                {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
