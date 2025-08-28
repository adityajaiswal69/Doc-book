"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Database } from "@/types/database";

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          // If profile doesn't exist, try to create one from auth metadata
          if (error.code === 'PGRST116') {
            const name = user.user_metadata?.name || 
                        user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || '';
            
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                name: name,
                avatar_url: user.user_metadata?.avatar_url || null
              })
              .select()
              .single();

            if (insertError) {
              throw insertError;
            }

            setProfile(newProfile);
          } else {
            throw error;
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user?.id, user?.email, user?.user_metadata]);

  const updateProfile = async (updates: Partial<Pick<Profile, 'name' | 'avatar_url'>>) => {
    if (!user?.id || !profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } catch (err) {
      throw err;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    displayName: profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  };
}
