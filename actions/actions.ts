"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function createDocument() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized - User must be logged in");
  }

  const supabase = createServerSupabaseClient();

  // Create the document
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .insert({
      title: "Untitled Document",
    })
    .select()
    .single();

  if (documentError) {
    throw new Error(`Failed to create document: ${documentError.message}`);
  }

  // Create user room relationship
  const { error: userRoomError } = await supabase
    .from('user_rooms')
    .insert({
      user_id: userId,
      room_id: document.id,
      role: 'owner',
    });

  if (userRoomError) {
    // Clean up the document if user room creation fails
    await supabase.from('documents').delete().eq('id', document.id);
    throw new Error(`Failed to create user room: ${userRoomError.message}`);
  }

  return { docId: document.id };
}