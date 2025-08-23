"use server";

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for server actions
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// This function is no longer needed since we pass userId directly

export async function createDocument(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Creating document for user:', userId)

    // Create the document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: "Untitled Document",
      })
      .select()
      .single()

    if (documentError) {
      console.error('Document creation error:', documentError)
      throw new Error(`Failed to create document: ${documentError.message}`)
    }

    console.log('Document created:', document.id)

    // Create user room relationship
    const { error: userRoomError } = await supabase
      .from('user_rooms')
      .insert({
        user_id: userId,
        room_id: document.id,
        role: 'owner',
      })

    if (userRoomError) {
      console.error('User room creation error:', userRoomError)
      // Clean up the document if user room creation fails
      await supabase.from('documents').delete().eq('id', document.id)
      throw new Error(`Failed to create user room: ${userRoomError.message}`)
    }

    console.log('User room created successfully')

    return { docId: document.id }
  } catch (error) {
    console.error('Error in createDocument:', error)
    throw error
  }
}

export async function getDocuments(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Fetching documents for user:', userId)

    // Fetch user rooms (permissions)
    const { data: userRooms, error: userRoomsError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)

    if (userRoomsError) {
      console.error('Error fetching user rooms:', userRoomsError)
      throw new Error(`Failed to fetch user rooms: ${userRoomsError.message}`)
    }

    console.log('User rooms found:', userRooms?.length || 0)

    // Fetch documents for rooms user has access to
    if (userRooms && userRooms.length > 0) {
      const roomIds = userRooms.map(ur => ur.room_id)
      console.log('Fetching documents for room IDs:', roomIds)
      
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .in('id', roomIds)

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
        throw new Error(`Failed to fetch documents: ${documentsError.message}`)
      }
      
      console.log('Documents found:', documents?.length || 0)
      return { documents: documents || [], userRooms: userRooms || [] }
    } else {
      console.log('No user rooms found')
      return { documents: [], userRooms: userRooms || [] }
    }
  } catch (error) {
    console.error('Error in getDocuments:', error)
    throw error
  }
}

export async function getDocument(id: string, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Fetching document with ID:', id, 'for user:', userId)

    // First check if user has access to this document
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', id)
      .single()

    if (userRoomError || !userRoom) {
      console.error('User does not have access to document:', id)
      throw new Error("Access denied to this document")
    }

    // Fetch the document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (documentError) {
      console.error('Error fetching document:', documentError)
      throw new Error(`Failed to fetch document: ${documentError.message}`)
    }

    console.log('Document fetched:', document)
    return { document }
  } catch (error) {
    console.error('Error in getDocument:', error)
    throw error
  }
}

export async function updateDocument(id: string, updates: { title?: string; content?: string }, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Updating document with ID:', id, 'for user:', userId)

    // First check if user has access to this document
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', id)
      .single()

    if (userRoomError || !userRoom) {
      console.error('User does not have access to document:', id)
      throw new Error("Access denied to this document")
    }

    // Update the document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (documentError) {
      console.error('Error updating document:', documentError)
      throw new Error(`Failed to update document: ${documentError.message}`)
    }

    console.log('Document updated:', document)
    return { document }
  } catch (error) {
    console.error('Error in updateDocument:', error)
    throw error
  }
}

export async function testDatabaseConnection(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Testing database connection for user:', userId)

    // Test 1: Check if we can fetch user rooms
    const { data: userRooms, error: userRoomsError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)

    console.log('User rooms test:', { data: userRooms, error: userRoomsError })

    // Test 2: Check if we can fetch documents
    if (userRooms && userRooms.length > 0) {
      const roomIds = userRooms.map(ur => ur.room_id)
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .in('id', roomIds)

      console.log('Documents test:', { data: documents, error: documentsError })
    }

    return { userRooms, error: userRoomsError }
  } catch (error) {
    console.error('Error in testDatabaseConnection:', error)
    throw error
  }
}