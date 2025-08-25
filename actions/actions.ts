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

    // Get the next order index for root level
    const { data: rootDocs, error: rootError } = await supabase
      .from('documents')
      .select('order_index')
      .is('parent_id', null)
      .order('order_index', { ascending: false })
      .limit(1)

    if (rootError) {
      console.error('Error fetching root documents:', rootError)
      throw new Error(`Failed to get order index: ${rootError.message}`)
    }

    let orderIndex = 0;
    if (rootDocs && rootDocs.length > 0) {
      orderIndex = rootDocs[0].order_index + 1
    }

    // Create the document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: "Untitled Document",
        content: "", // Ensure content field is set
        type: "document",
        parent_id: null,
        order_index: orderIndex,
      })
      .select()
      .single()

    if (documentError) {
      console.error('Document creation error:', documentError)
      throw new Error(`Failed to create document: ${documentError.message}`)
    }

    console.log('Document created:', document.id)

    // Create user room relationship
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .insert({
        user_id: userId,
        room_id: document.id,
        role: 'owner',
      })
      .select()
      .single()

    if (userRoomError) {
      console.error('User room creation error:', userRoomError)
      // Clean up the document if user room creation fails
      await supabase.from('documents').delete().eq('id', document.id)
      throw new Error(`Failed to create user room: ${userRoomError.message}`)
    }

    console.log('User room created successfully:', userRoom)

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

export async function updateDocument(id: string, updates: { title?: string; content?: string; blocks_content?: any }, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Updating document with ID:', id, 'for user:', userId)
    console.log('Update type:', updates.title ? 'title' : updates.content ? 'content' : updates.blocks_content ? 'blocks' : 'both')
    if (updates.content) {
      console.log('Content length:', updates.content.length, 'characters')
    }
    if (updates.blocks_content) {
      console.log('Blocks count:', Array.isArray(updates.blocks_content) ? updates.blocks_content.length : 'not array')
    }

    // First check if user has access to this document
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', id)
      .single()

    console.log('User room check result:', { userRoom, userRoomError })

    if (userRoomError) {
      console.error('Error checking user room access:', userRoomError)
      // Check if it's a "no rows returned" error (which is expected if user has no access)
      if (userRoomError.code === 'PGRST116') {
        throw new Error("Access denied to this document")
      }
      throw new Error(`Database error: ${userRoomError.message}`)
    }

    if (!userRoom) {
      console.error('User does not have access to document:', id)
      throw new Error("Access denied to this document")
    }

    // Update the document with optimized handling for large content
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString() // Ensure timestamp is updated
    }

    const { data: document, error: documentError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (documentError) {
      console.error('Error updating document:', documentError)
      throw new Error(`Failed to update document: ${documentError.message}`)
    }

    console.log('Document updated successfully:', {
      id: document.id,
      titleLength: document.title?.length || 0,
      contentLength: document.content?.length || 0,
      blocksCount: Array.isArray(document.blocks_content) ? document.blocks_content.length : 0,
      updatedAt: document.updated_at
    })
    
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

export async function checkUserDocumentAccess(userId: string, documentId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Checking user access to document:', { userId, documentId })

    // Check if document exists
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (documentError) {
      console.error('Document not found:', documentError)
      return { hasAccess: false, reason: 'Document not found', document: null, userRoom: null }
    }

    // Check if user has access
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', documentId)
      .single()

    if (userRoomError) {
      console.error('Error checking user room:', userRoomError)
      return { hasAccess: false, reason: 'Database error checking access', document, userRoom: null }
    }

    if (!userRoom) {
      console.error('User has no access to document')
      return { hasAccess: false, reason: 'No user room relationship found', document, userRoom: null }
    }

    console.log('User has access to document')
    return { hasAccess: true, reason: 'Access granted', document, userRoom }
  } catch (error) {
    console.error('Error in checkUserDocumentAccess:', error)
    throw error
  }
}

export async function repairUserDocumentAccess(userId: string, documentId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Attempting to repair user access to document:', { userId, documentId })

    // First check current access
    const accessCheck = await checkUserDocumentAccess(userId, documentId)
    
    if (accessCheck.hasAccess) {
      console.log('User already has access, no repair needed')
      return { success: true, message: 'Access already exists' }
    }

    // Check if document exists
    if (!accessCheck.document) {
      throw new Error('Document not found')
    }

    // Create user room relationship
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .insert({
        user_id: userId,
        room_id: documentId,
        role: 'owner',
      })
      .select()
      .single()

    if (userRoomError) {
      console.error('Failed to create user room:', userRoomError)
      throw new Error(`Failed to repair access: ${userRoomError.message}`)
    }

    console.log('Successfully repaired user access')
    return { success: true, message: 'Access repaired successfully', userRoom }
  } catch (error) {
    console.error('Error in repairUserDocumentAccess:', error)
    throw error
  }
}

export async function deleteDocument(documentId: string, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Deleting document with ID:', documentId, 'for user:', userId)

    // First check if user has access to this document
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', documentId)
      .single()

    if (userRoomError || !userRoom) {
      console.error('User does not have access to document:', documentId)
      throw new Error("Access denied to this document")
    }

    // Check if user is owner (only owners can delete)
    if (userRoom.role !== 'owner') {
      throw new Error("Only document owners can delete documents")
    }

    // Delete all user room relationships for this document
    const { error: deleteUserRoomsError } = await supabase
      .from('user_rooms')
      .delete()
      .eq('room_id', documentId)

    if (deleteUserRoomsError) {
      console.error('Error deleting user rooms:', deleteUserRoomsError)
      throw new Error(`Failed to delete user rooms: ${deleteUserRoomsError.message}`)
    }

    // Delete the document
    const { error: deleteDocumentError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteDocumentError) {
      console.error('Error deleting document:', deleteDocumentError)
      throw new Error(`Failed to delete document: ${deleteDocumentError.message}`)
    }

    console.log('Document deleted successfully')
    return { success: true, message: 'Document deleted successfully' }
  } catch (error) {
    console.error('Error in deleteDocument:', error)
    throw error
  }
}

export async function createFolder(userId: string, parentId?: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Creating folder for user:', userId, 'parentId:', parentId)

    // Get the next order index for the parent
    let orderIndex = 0;
    if (parentId) {
      const { data: siblings, error: siblingsError } = await supabase
        .from('documents')
        .select('order_index')
        .eq('parent_id', parentId)
        .order('order_index', { ascending: false })
        .limit(1)

      if (siblingsError) {
        console.error('Error fetching siblings:', siblingsError)
        throw new Error(`Failed to get order index: ${siblingsError.message}`)
      }

      if (siblings && siblings.length > 0) {
        orderIndex = siblings[0].order_index + 1
      }
    } else {
      // Root level - get next order index
      const { data: rootDocs, error: rootError } = await supabase
        .from('documents')
        .select('order_index')
        .is('parent_id', null)
        .order('order_index', { ascending: false })
        .limit(1)

      if (rootError) {
        console.error('Error fetching root documents:', rootError)
        throw new Error(`Failed to get order index: ${rootError.message}`)
      }

      if (rootDocs && rootDocs.length > 0) {
        orderIndex = rootDocs[0].order_index + 1
      }
    }

    // Create the folder
    const { data: folder, error: folderError } = await supabase
      .from('documents')
      .insert({
        title: "Untitled Folder",
        content: "",
        type: "folder",
        parent_id: parentId || null,
        order_index: orderIndex,
      })
      .select()
      .single()

    if (folderError) {
      console.error('Folder creation error:', folderError)
      throw new Error(`Failed to create folder: ${folderError.message}`)
    }

    console.log('Folder created:', folder.id)

    // Create user room relationship
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .insert({
        user_id: userId,
        room_id: folder.id,
        role: 'owner',
      })
      .select()
      .single()

    if (userRoomError) {
      console.error('User room creation error:', userRoomError)
      // Clean up the folder if user room creation fails
      await supabase.from('documents').delete().eq('id', folder.id)
      throw new Error(`Failed to create user room: ${userRoomError.message}`)
    }

    console.log('User room created successfully:', userRoom)

    return { folderId: folder.id }
  } catch (error) {
    console.error('Error in createFolder:', error)
    throw error
  }
}

export async function createDocumentInFolder(userId: string, parentId?: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Creating document in folder for user:', userId, 'parentId:', parentId)

    // Get the next order index for the parent
    let orderIndex = 0;
    if (parentId) {
      const { data: siblings, error: siblingsError } = await supabase
        .from('documents')
        .select('order_index')
        .eq('parent_id', parentId)
        .order('order_index', { ascending: false })
        .limit(1)

      if (siblingsError) {
        console.error('Error fetching siblings:', siblingsError)
        throw new Error(`Failed to get order index: ${siblingsError.message}`)
      }

      if (siblings && siblings.length > 0) {
        orderIndex = siblings[0].order_index + 1
      }
    } else {
      // Root level - get next order index
      const { data: rootDocs, error: rootError } = await supabase
        .from('documents')
        .select('order_index')
        .is('parent_id', null)
        .order('order_index', { ascending: false })
        .limit(1)

      if (rootError) {
        console.error('Error fetching root documents:', rootError)
        throw new Error(`Failed to get order index: ${rootError.message}`)
      }

      if (rootDocs && rootDocs.length > 0) {
        orderIndex = rootDocs[0].order_index + 1
      }
    }

    // Create the document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: "Untitled Document",
        content: "",
        type: "document",
        parent_id: parentId || null,
        order_index: orderIndex,
      })
      .select()
      .single()

    if (documentError) {
      console.error('Document creation error:', documentError)
      throw new Error(`Failed to create document: ${documentError.message}`)
    }

    console.log('Document created:', document.id)

    // Create user room relationship
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .insert({
        user_id: userId,
        room_id: document.id,
        role: 'owner',
      })
      .select()
      .single()

    if (userRoomError) {
      console.error('User room creation error:', userRoomError)
      // Clean up the document if user room creation fails
      await supabase.from('documents').delete().eq('id', document.id)
      throw new Error(`Failed to create user room: ${userRoomError.message}`)
    }

    console.log('User room created successfully:', userRoom)

    return { docId: document.id }
  } catch (error) {
    console.error('Error in createDocumentInFolder:', error)
    throw error
  }
}

export async function renameDocument(documentId: string, newTitle: string, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Renaming document with ID:', documentId, 'to:', newTitle, 'for user:', userId)

    // First check if user has access to this document
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', documentId)
      .single()

    if (userRoomError || !userRoom) {
      console.error('User does not have access to document:', documentId)
      throw new Error("Access denied to this document")
    }

    // Update the document title
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .update({ 
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single()

    if (documentError) {
      console.error('Error updating document title:', documentError)
      throw new Error(`Failed to update document title: ${documentError.message}`)
    }

    console.log('Document renamed successfully:', document)
    return { document }
  } catch (error) {
    console.error('Error in renameDocument:', error)
    throw error
  }
}

export async function moveDocument(documentId: string, newParentId: string | null, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('Moving document with ID:', documentId, 'to parent:', newParentId, 'for user:', userId)

    // First check if user has access to this document
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', documentId)
      .single()

    if (userRoomError || !userRoom) {
      console.error('User does not have access to document:', documentId)
      throw new Error("Access denied to this document")
    }

    // If moving to a folder, check if user has access to the target folder
    if (newParentId) {
      const { data: targetUserRoom, error: targetUserRoomError } = await supabase
        .from('user_rooms')
        .select('*')
        .eq('user_id', userId)
        .eq('room_id', newParentId)
        .single()

      if (targetUserRoomError || !targetUserRoom) {
        console.error('User does not have access to target folder:', newParentId)
        throw new Error("Access denied to target folder")
      }
    }

    // Get the next order index for the new parent
    let orderIndex = 0;
    if (newParentId) {
      const { data: siblings, error: siblingsError } = await supabase
        .from('documents')
        .select('order_index')
        .eq('parent_id', newParentId)
        .order('order_index', { ascending: false })
        .limit(1)

      if (siblingsError) {
        console.error('Error fetching siblings:', siblingsError)
        throw new Error(`Failed to get order index: ${siblingsError.message}`)
      }

      if (siblings && siblings.length > 0) {
        orderIndex = siblings[0].order_index + 1
      }
    } else {
      // Root level - get next order index
      const { data: rootDocs, error: rootError } = await supabase
        .from('documents')
        .select('order_index')
        .is('parent_id', null)
        .order('order_index', { ascending: false })
        .limit(1)

      if (rootError) {
        console.error('Error fetching root documents:', rootError)
        throw new Error(`Failed to get order index: ${rootError.message}`)
      }

      if (rootDocs && rootDocs.length > 0) {
        orderIndex = rootDocs[0].order_index + 1
      }
    }

    // Update the document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .update({ 
        parent_id: newParentId,
        order_index: orderIndex,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single()

    if (documentError) {
      console.error('Error moving document:', documentError)
      throw new Error(`Failed to move document: ${documentError.message}`)
    }

    console.log('Document moved successfully:', document)
    return { document }
  } catch (error) {
    console.error('Error in moveDocument:', error)
    throw error
  }
}