"use server";

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

async function createServerSupabaseClient() {
  // Use the standard createClient for server actions with service role key
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for server actions
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Anonymous client for public access (no authentication required)
function createAnonymousSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// This function is no longer needed since we pass userId directly

export async function createDocument(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()

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



    return { docId: document.id }
  } catch (error) {
    console.error('Error in createDocument:', error)
    throw error
  }
}

export async function getDocuments(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // Fetch user rooms (permissions)
    const { data: userRooms, error: userRoomsError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)

    if (userRoomsError) {
      console.error('Error fetching user rooms:', userRoomsError)
      throw new Error(`Failed to fetch user rooms: ${userRoomsError.message}`)
    }



    // Fetch documents for rooms user has access to
    if (userRooms && userRooms.length > 0) {
      const roomIds = userRooms.map(ur => ur.room_id)

      
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .in('id', roomIds)

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
        throw new Error(`Failed to fetch documents: ${documentsError.message}`)
      }
      

      return { documents: documents || [], userRooms: userRooms || [] }
    } else {

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


    return { document }
  } catch (error) {
    console.error('Error in getDocument:', error)
    throw error
  }
}

export async function updateDocument(id: string, updates: { title?: string; content?: string; blocks_content?: any }, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // First check if user has access to this document
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', id)
      .single()



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


    
    return { document }
  } catch (error) {
    console.error('Error in updateDocument:', error)
    throw error
  }
}

export async function testDatabaseConnection(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // Test 1: Check if we can fetch user rooms
    const { data: userRooms, error: userRoomsError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)



    // Test 2: Check if we can fetch documents
    if (userRooms && userRooms.length > 0) {
      const roomIds = userRooms.map(ur => ur.room_id)
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .in('id', roomIds)


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


    return { hasAccess: true, reason: 'Access granted', document, userRoom }
  } catch (error) {
    console.error('Error in checkUserDocumentAccess:', error)
    throw error
  }
}

export async function repairUserDocumentAccess(userId: string, documentId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // First check current access
    const accessCheck = await checkUserDocumentAccess(userId, documentId)
    
    if (accessCheck.hasAccess) {

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


    return { success: true, message: 'Access repaired successfully', userRoom }
  } catch (error) {
    console.error('Error in repairUserDocumentAccess:', error)
    throw error
  }
}

export async function deleteDocument(documentId: string, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


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


    return { success: true, message: 'Document deleted successfully' }
  } catch (error) {
    console.error('Error in deleteDocument:', error)
    throw error
  }
}

export async function createFolder(userId: string, parentId?: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


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



    return { folderId: folder.id }
  } catch (error) {
    console.error('Error in createFolder:', error)
    throw error
  }
}

export async function createDocumentInFolder(userId: string, parentId?: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


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



    return { docId: document.id }
  } catch (error) {
    console.error('Error in createDocumentInFolder:', error)
    throw error
  }
}

export async function renameDocument(documentId: string, newTitle: string, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


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


    return { document }
  } catch (error) {
    console.error('Error in renameDocument:', error)
    throw error
  }
}

export async function moveDocument(documentId: string, newParentId: string | null, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


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


    return { document }
  } catch (error) {
    console.error('Error in moveDocument:', error)
    throw error
  }
}

// Image handling functions
export async function uploadImage(
  documentId: string, 
  blockId: string, 
  file: File, 
  userId: string
) {
  try {
    const supabase = await createServerSupabaseClient()
    

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    })

    // Check if user has access to this document
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

    // Get document title for storage path
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('title')
      .eq('id', documentId)
      .single()

    if (documentError || !document) {
      console.error('Document not found:', documentId)
      throw new Error("Document not found")
    }

    // Create storage path
    const sanitizedTitle = document.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
    const storagePath = `${sanitizedTitle}/${blockId}.image/${file.name}`
    
    console.log('Storage path:', storagePath)
    console.log('Document title:', document.title, '-> sanitized:', sanitizedTitle)

    // Check if there's an existing image for this block that needs cleanup
    const { data: existingImage } = await supabase
      .from('storage_images')
      .select('*')
      .eq('document_id', documentId)
      .eq('block_id', blockId)
      .single()

    // If replacing an uploaded image, delete the old file from storage
    if (existingImage && existingImage.mode === 'upload' && existingImage.file_path) {
      console.log('Cleaning up existing image:', existingImage.file_path)
      
      // Try to find and delete the actual file in the folder
      try {
        // List files in the directory
        const folderPath = existingImage.file_path.endsWith('/') ? existingImage.file_path : existingImage.file_path + '/'
        const { data: files, error: listError } = await supabase.storage
          .from('images')
          .list(folderPath.replace(/\/$/, ''), { limit: 100 })
        
        if (!listError && files && files.length > 0) {
          // Delete all files in the block folder
          const filesToDelete = files.map(file => folderPath + file.name)
          console.log('Deleting files:', filesToDelete)
          
          const { error: cleanupError } = await supabase.storage
            .from('images')
            .remove(filesToDelete)
          
          if (cleanupError) {
            console.warn('Warning: Could not delete old image files:', cleanupError.message)
          } else {
            console.log('Successfully deleted old image files:', filesToDelete.length)
          }
        } else {
          console.warn('No files found in folder:', folderPath)
        }
      } catch (error) {
        console.warn('Warning: Error during cleanup:', error instanceof Error ? error.message : String(error))
        // Continue with upload anyway
      }
    }

    // Check if bucket exists first
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('Error checking buckets:', bucketError)
      throw new Error('Failed to access storage')
    }

    const imagesBucket = buckets.find(bucket => bucket.name === 'images')
    if (!imagesBucket) {
      throw new Error('Storage bucket "images" not found. Please run: node setup-storage.js to create the bucket and set up storage policies.')
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      console.error('Upload error details:', {
        message: uploadError.message,
        stack: uploadError.stack
      })
      
      // Provide more specific error messages
      if (uploadError.message.includes('not found')) {
        throw new Error('Storage bucket "images" not found. Please run: node setup-storage.js to create the bucket.')
      } else if (uploadError.message.includes('permission')) {
        throw new Error('Permission denied. Please check your storage bucket policies or run: node setup-storage.js')
      } else if (uploadError.message.includes('file size') || uploadError.message.includes('exceeded') || uploadError.message.includes('maximum')) {
        throw new Error(`File size exceeds the allowed limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB. The current bucket limit is 50MB. Please reduce the file size.`)
      } else if (uploadError.message.includes('file type') || uploadError.message.includes('mime')) {
        throw new Error(`File type not allowed. File type: ${file.type}. Please use JPG, PNG, GIF, WebP, SVG, BMP, TIFF, or ICO.`)
      } else {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath)

    // Store image metadata in database
    // Note: Using existing function signature for now
    const { data: imageData, error: imageError } = await supabase
      .rpc('handle_image_block', {
        p_document_id: documentId,
        p_block_id: blockId,
        p_mode: 'upload',
        p_url: urlData.publicUrl,
        p_original_filename: file.name,
        p_file_size: file.size,
        p_mime_type: file.type
      })
    
    // Update the file_path separately if needed
    if (!imageError && imageData) {
      await supabase
        .from('storage_images')
        .update({ file_path: storagePath })
        .eq('document_id', documentId)
        .eq('block_id', blockId)
    }

    if (imageError) {
      console.error('Error storing image metadata:', imageError)
      // Clean up uploaded file if metadata storage fails
      await supabase.storage.from('images').remove([storagePath])
      throw new Error(`Failed to store image metadata: ${imageError.message}`)
    }


    
    // Optional: Run cleanup of deleted images in background (don't await to avoid blocking)
    cleanupMarkedForDeletion().catch(error => 
      console.warn('Background cleanup failed:', error.message)
    )
    
    return { 
      success: true, 
      imageData,
      url: urlData.publicUrl,
      filePath: storagePath
    }
  } catch (error) {
    console.error('Error in uploadImage:', error)
    throw error
  }
}

export async function addExternalImage(
  documentId: string, 
  blockId: string, 
  url: string, 
  userId: string,
  altText?: string
) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // Check if user has access to this document
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

    // Validate URL
    const { data: isValid } = await supabase
      .rpc('validate_image_url', { p_url: url })

    if (!isValid) {
      throw new Error("Invalid image URL format")
    }

    // Store image metadata in database
    const { data: imageData, error: imageError } = await supabase
      .rpc('handle_image_block', {
        p_document_id: documentId,
        p_block_id: blockId,
        p_mode: 'external',
        p_url: url,
        p_alt_text: altText
      })

    if (imageError) {
      console.error('Error storing external image metadata:', imageError)
      throw new Error(`Failed to store image metadata: ${imageError.message}`)
    }


    return { 
      success: true, 
      imageData,
      url: url
    }
  } catch (error) {
    console.error('Error in addExternalImage:', error)
    throw error
  }
}

export async function deleteImage(documentId: string, blockId: string, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // Check if user has access to this document
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

    // Get image data to check if it's an uploaded file
    const { data: imageData, error: imageError } = await supabase
      .from('storage_images')
      .select('*')
      .eq('document_id', documentId)
      .eq('block_id', blockId)
      .single()

    if (imageError) {
      console.error('Error fetching image data:', imageError)
      throw new Error(`Failed to fetch image data: ${imageError.message}`)
    }

    if (!imageData) {
      console.log('No image found for deletion')
      return { success: true, message: 'No image found' }
    }

    // If it's an uploaded image, delete the file from storage
    if (imageData.mode === 'upload' && imageData.file_path) {
      console.log('Deleting image file from storage:', imageData.file_path)
      
      try {
        // Since file_path might be just the folder, we need to list and delete all files in it
        const folderPath = imageData.file_path.endsWith('/') ? imageData.file_path : imageData.file_path + '/'
        
        // List files in the directory
        const { data: files, error: listError } = await supabase.storage
          .from('images')
          .list(folderPath.replace(/\/$/, ''), { limit: 100 })
        
        if (!listError && files && files.length > 0) {
          // Delete all files in the block folder
          const filesToDelete = files.map(file => folderPath + file.name)
          console.log('Deleting files:', filesToDelete)
          
          const { error: storageError } = await supabase.storage
            .from('images')
            .remove(filesToDelete)
          
          if (storageError) {
            console.error('Error deleting files from storage:', storageError.message)
            console.warn('Database record will still be deleted despite storage cleanup failure')
          } else {
            console.log('Successfully deleted', filesToDelete.length, 'image files from storage')
          }
        } else if (listError) {
          console.error('Error listing files in folder:', listError.message)
        } else {
          console.log('No files found in folder:', folderPath)
        }
        
        // Also try to delete the folder itself if it's empty
        try {
          await supabase.storage.from('images').remove([folderPath.replace(/\/$/, '')])
        } catch (folderError) {
          // Ignore folder deletion errors as it might not be empty or might not exist
        }
        
      } catch (error) {
        console.error('Error during storage cleanup:', error instanceof Error ? error.message : String(error))
        console.warn('Database record will still be deleted despite storage cleanup failure')
      }
    } else {
      console.log('Image is external URL or has no file path, skipping storage cleanup')
    }

    // Delete from database
    const { data: deleteData, error: deleteError } = await supabase
      .rpc('delete_image_block', {
        p_document_id: documentId,
        p_block_id: blockId
      })

    if (deleteError) {
      console.error('Error deleting image from database:', deleteError)
      throw new Error(`Failed to delete image: ${deleteError.message}`)
    }


    return { success: true, message: 'Image deleted successfully' }
  } catch (error) {
    console.error('Error in deleteImage:', error)
    throw error
  }
}

// Video handling functions
export async function uploadVideo(
  documentId: string, 
  blockId: string, 
  file: File, 
  userId: string
) {
  try {
    const supabase = await createServerSupabaseClient()
    

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    })

    // Check if user has access to this document
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

    // Get document title for storage path
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('title')
      .eq('id', documentId)
      .single()

    if (documentError || !document) {
      console.error('Document not found:', documentId)
      throw new Error("Document not found")
    }

    // Create storage path
    const sanitizedTitle = document.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
    const storagePath = `${sanitizedTitle}/${blockId}.video/${file.name}`
    
    console.log('Storage path:', storagePath)
    console.log('Document title:', document.title, '-> sanitized:', sanitizedTitle)

    // Check if there's an existing video for this block that needs cleanup
    const { data: existingVideo } = await supabase
      .from('storage_images')
      .select('*')
      .eq('document_id', documentId)
      .eq('block_id', blockId)
      .single()

    // If replacing an uploaded video, delete the old file from storage
    if (existingVideo && existingVideo.mode === 'upload' && existingVideo.file_path) {
      console.log('Cleaning up existing video:', existingVideo.file_path)
      
      // Try to find and delete the actual file in the folder
      try {
        // List files in the directory
        const folderPath = existingVideo.file_path.endsWith('/') ? existingVideo.file_path : existingVideo.file_path + '/'
        const { data: files, error: listError } = await supabase.storage
          .from('images')
          .list(folderPath.replace(/\/$/, ''), { limit: 100 })
        
        if (!listError && files && files.length > 0) {
          // Delete all files in the block folder
          const filesToDelete = files.map(file => folderPath + file.name)
          console.log('Deleting files:', filesToDelete)
          
          const { error: cleanupError } = await supabase.storage
            .from('images')
            .remove(filesToDelete)
          
          if (cleanupError) {
            console.warn('Warning: Could not delete old video files:', cleanupError.message)
          } else {
            console.log('Successfully deleted old video files:', filesToDelete.length)
          }
        } else {
          console.warn('No files found in folder:', folderPath)
        }
      } catch (error) {
        console.warn('Warning: Error during cleanup:', error instanceof Error ? error.message : String(error))
        // Continue with upload anyway
      }
    }

    // Check if bucket exists first
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('Error checking buckets:', bucketError)
      throw new Error('Failed to access storage')
    }

    const imagesBucket = buckets.find(bucket => bucket.name === 'images')
    if (!imagesBucket) {
      throw new Error('Storage bucket "images" not found. Please run: node setup-storage.js to create the bucket and set up storage policies.')
    }

    // Upload file to Supabase Storage (using images bucket for videos too)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      console.error('Upload error details:', {
        message: uploadError.message,
        stack: uploadError.stack
      })
      
      // Provide more specific error messages
      if (uploadError.message.includes('not found')) {
        throw new Error('Storage bucket "images" not found. Please run: node setup-storage.js to create the bucket.')
      } else if (uploadError.message.includes('permission')) {
        throw new Error('Permission denied. Please check your storage bucket policies or run: node setup-storage.js')
      } else if (uploadError.message.includes('file size') || uploadError.message.includes('exceeded') || uploadError.message.includes('maximum')) {
        throw new Error(`File size exceeds the allowed limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB. The current bucket limit is 500MB. Please reduce the file size.`)
      } else if (uploadError.message.includes('file type') || uploadError.message.includes('mime')) {
        throw new Error(`File type not allowed. File type: ${file.type}. Please use MP4, MOV, AVI, MKV, WebM, M4V, FLV, WMV, or OGV.`)
      } else {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath)

    // Store video metadata in database (reusing storage_images table)
    const { data: videoData, error: videoError } = await supabase
      .rpc('handle_image_block', {
        p_document_id: documentId,
        p_block_id: blockId,
        p_mode: 'upload',
        p_url: urlData.publicUrl,
        p_original_filename: file.name,
        p_file_size: file.size,
        p_mime_type: file.type
      })
    
    // Update the file_path separately if needed
    if (!videoError && videoData) {
      await supabase
        .from('storage_images')
        .update({ file_path: storagePath })
        .eq('document_id', documentId)
        .eq('block_id', blockId)
    }

    if (videoError) {
      console.error('Error storing video metadata:', videoError)
      // Clean up uploaded file if metadata storage fails
      await supabase.storage.from('images').remove([storagePath])
      throw new Error(`Failed to store video metadata: ${videoError.message}`)
    }


    
    return { 
      success: true, 
      videoData,
      url: urlData.publicUrl,
      filePath: storagePath
    }
  } catch (error) {
    console.error('Error in uploadVideo:', error)
    throw error
  }
}

export async function addExternalVideo(
  documentId: string, 
  blockId: string, 
  url: string, 
  userId: string,
  caption?: string
) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // Check if user has access to this document
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

    // Store video metadata in database (reusing storage_images table and function)
    const { data: videoData, error: videoError } = await supabase
      .rpc('handle_image_block', {
        p_document_id: documentId,
        p_block_id: blockId,
        p_mode: 'external',
        p_url: url,
        p_alt_text: caption
      })

    if (videoError) {
      console.error('Error storing external video metadata:', videoError)
      throw new Error(`Failed to store video metadata: ${videoError.message}`)
    }


    return { 
      success: true, 
      videoData,
      url: url
    }
  } catch (error) {
    console.error('Error in addExternalVideo:', error)
    throw error
  }
}

export async function deleteVideo(documentId: string, blockId: string, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // Check if user has access to this document
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

    // Get video data to check if it's an uploaded file (reusing storage_images table)
    const { data: videoData, error: videoError } = await supabase
      .from('storage_images')
      .select('*')
      .eq('document_id', documentId)
      .eq('block_id', blockId)
      .single()

    if (videoError) {
      console.error('Error fetching video data:', videoError)
      throw new Error(`Failed to fetch video data: ${videoError.message}`)
    }

    if (!videoData) {
      console.log('No video found for deletion')
      return { success: true, message: 'No video found' }
    }

    // If it's an uploaded video, delete the file from storage
    if (videoData.mode === 'upload' && videoData.file_path) {
      console.log('Deleting video file from storage:', videoData.file_path)
      
      try {
        // Since file_path might be just the folder, we need to list and delete all files in it
        const folderPath = videoData.file_path.endsWith('/') ? videoData.file_path : videoData.file_path + '/'
        
        // List files in the directory
        const { data: files, error: listError } = await supabase.storage
          .from('images')
          .list(folderPath.replace(/\/$/, ''), { limit: 100 })
        
        if (!listError && files && files.length > 0) {
          // Delete all files in the block folder
          const filesToDelete = files.map(file => folderPath + file.name)
          console.log('Deleting files:', filesToDelete)
          
          const { error: storageError } = await supabase.storage
            .from('images')
            .remove(filesToDelete)
          
          if (storageError) {
            console.error('Error deleting files from storage:', storageError.message)
            console.warn('Database record will still be deleted despite storage cleanup failure')
          } else {
            console.log('Successfully deleted', filesToDelete.length, 'video files from storage')
          }
        } else if (listError) {
          console.error('Error listing files in folder:', listError.message)
        } else {
          console.log('No files found in folder:', folderPath)
        }
        
        // Also try to delete the folder itself if it's empty
        try {
          await supabase.storage.from('images').remove([folderPath.replace(/\/$/, '')])
        } catch (folderError) {
          // Ignore folder deletion errors as it might not be empty or might not exist
        }
        
      } catch (error) {
        console.error('Error during storage cleanup:', error instanceof Error ? error.message : String(error))
        console.warn('Database record will still be deleted despite storage cleanup failure')
      }
    } else {
      console.log('Video is external URL or has no file path, skipping storage cleanup')
    }

    // Delete from database (reusing image delete function)
    const { data: deleteData, error: deleteError } = await supabase
      .rpc('delete_image_block', {
        p_document_id: documentId,
        p_block_id: blockId
      })

    if (deleteError) {
      console.error('Error deleting video from database:', deleteError)
      throw new Error(`Failed to delete video: ${deleteError.message}`)
    }


    return { success: true, message: 'Video deleted successfully' }
  } catch (error) {
    console.error('Error in deleteVideo:', error)
    throw error
  }
}

export async function getDocumentImages(documentId: string, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // Check if user has access to this document
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

    // Get all images for the document
    const { data: images, error: imagesError } = await supabase
      .rpc('get_document_images', { p_document_id: documentId })

    if (imagesError) {
      console.error('Error fetching document images:', imagesError)
      throw new Error(`Failed to fetch images: ${imagesError.message}`)
    }

    return { success: true, images: images || [] }
  } catch (error) {
    console.error('Error in getDocumentImages:', error)
    throw error
  }
}

// Background cleanup function for images marked for deletion
async function cleanupMarkedForDeletion() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get images marked for deletion (older than 5 minutes to avoid race conditions)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: deletedImages, error: queryError } = await supabase
      .from('storage_images')
      .select('file_path')
      .eq('mode', 'upload')
      .not('deleted_at', 'is', null)
      .not('file_path', 'is', null)
      .lt('deleted_at', fiveMinutesAgo)
      .limit(10) // Limit to avoid overloading

    if (queryError || !deletedImages || deletedImages.length === 0) {
      return // Silent fail for background cleanup
    }

    // Delete files from storage
    const pathsToDelete = deletedImages.map(img => img.file_path)
    const { error: storageError } = await supabase.storage
      .from('images')
      .remove(pathsToDelete)

    if (!storageError) {
      // Remove database records for successfully deleted files
      await supabase
        .from('storage_images')
        .delete()
        .not('deleted_at', 'is', null)
        .lt('deleted_at', fiveMinutesAgo)
        .in('file_path', pathsToDelete)
      
      console.log(`Background cleanup: removed ${pathsToDelete.length} deleted images`)
    }
  } catch (error) {
    // Silent fail for background cleanup
    console.warn('Background cleanup error:', error instanceof Error ? error.message : String(error))
  }
}

export async function cleanupOrphanedImages(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // This function should only be called by admin users or system processes
    // For now, we'll add a basic check
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .select('role')
      .eq('user_id', userId)
      .limit(1)

    if (userRoomError || !userRoom || userRoom.length === 0) {
      throw new Error("Access denied")
    }

    // Get orphaned images
    const { data: orphanedImages, error: orphanedError } = await supabase
      .rpc('get_orphaned_images')

    if (orphanedError) {
      console.error('Error fetching orphaned images:', orphanedError)
      throw new Error(`Failed to fetch orphaned images: ${orphanedError.message}`)
    }

    let deletedCount = 0;
    if (orphanedImages && orphanedImages.length > 0) {
      // Delete files from storage
      for (const image of orphanedImages) {
        if (image.file_path) {
          const { error: storageError } = await supabase
            .storage
            .from('images')
            .remove([image.file_path])

          if (storageError) {
            console.error('Error deleting orphaned file from storage:', storageError)
          }
        }
      }

      // Mark as deleted in database
      const { data: cleanupData, error: cleanupError } = await supabase
        .rpc('cleanup_orphaned_images')

      if (cleanupError) {
        console.error('Error cleaning up orphaned images:', cleanupError)
        throw new Error(`Failed to cleanup orphaned images: ${cleanupError.message}`)
      }

      deletedCount = cleanupData || 0;
    }

    console.log('Orphaned images cleanup completed:', deletedCount, 'images deleted')
    return { success: true, deletedCount }
  } catch (error) {
    console.error('Error in cleanupOrphanedImages:', error)
    throw error
  }
}

// Sharing functionality
export async function toggleDocumentSharing(id: string, isPublic: boolean, shareChildren: boolean, userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    


    // Check if user has access to this document
    const { data: userRoom, error: userRoomError } = await supabase
      .from('user_rooms')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', id)
      .single()



    if (userRoomError || !userRoom) {
      console.error('User does not have access to document:', id, 'Error:', userRoomError)
      throw new Error('Unauthorized - User does not have access to this document')
    }

    // Generate new preview token if making public
    const updateData: any = {
      is_public: isPublic,
      share_children: shareChildren,
      updated_at: new Date().toISOString()
    }

    if (isPublic) {
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_preview_token')
      
      if (tokenError) {
        console.error('Error generating preview token:', tokenError)
        throw new Error(`Failed to generate preview token: ${tokenError.message}`)
      }
      
      updateData.preview_token = tokenData
    } else {
      updateData.preview_token = null
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error toggling document sharing:', error)
      throw new Error(`Failed to toggle document sharing: ${error.message}`)
    }


    return data
  } catch (error) {
    console.error('Error in toggleDocumentSharing:', error)
    throw error
  }
}

export async function getSharedDocument(token: string) {
  try {
    console.log('🔍 Fetching shared document with token:', token)

    // Use service role client for reliable access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, find the main document with the token
    console.log('Finding main document with token...')
    const { data: mainDoc, error: mainDocError } = await supabase
      .from('documents')
      .select('*')
      .eq('preview_token', token)
      .eq('is_public', true)
      .single()

    if (mainDocError || !mainDoc) {
      console.log('❌ No public document found with token:', token)
      return createDemoDocument(token, 'No public document found with this token.')
    }

    console.log('✅ Found main document:', mainDoc.title, 'share_children:', mainDoc.share_children)

    // Start with the main document
    const allDocuments = [mainDoc]

    // If the main document has share_children = true, recursively get all descendants
    if (mainDoc.share_children) {
      console.log('🔄 Main document shares children, fetching all descendants...')
      const descendants = await getAllDescendants(supabase, mainDoc.id)
      allDocuments.push(...descendants)
      console.log(`✅ Found ${descendants.length} descendant documents`)
    }

    console.log('✅ Total documents returned:', allDocuments.length)
    return allDocuments

  } catch (error) {
    console.error('❌ Error in getSharedDocument:', error)
    return createDemoDocument(token, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to recursively get all descendants of a document/folder
async function getAllDescendants(supabase: any, parentId: string): Promise<any[]> {
  const { data: children, error } = await supabase
    .from('documents')
    .select('*')
    .eq('parent_id', parentId)
    .order('order_index')

  if (error) {
    console.error('Error fetching children:', error)
    return []
  }

  if (!children || children.length === 0) {
    return []
  }

  const allDescendants = [...children]

  // For each child that is a folder, recursively get its children
  for (const child of children) {
    if (child.type === 'folder') {
      console.log(`🔄 Getting descendants of folder: ${child.title}`)
      const grandchildren = await getAllDescendants(supabase, child.id)
      allDescendants.push(...grandchildren)
    }
  }

  return allDescendants
}

// Helper function to create demo documents
function createDemoDocument(token: string, reason: string) {
  
  
  const demoDocument = {
    id: 'demo-doc-' + Date.now(),
    title: 'Demo Shared Document',
    content: `Demo document for preview token: ${token}\n\nReason: ${reason}\n\nThis is a fallback document to demonstrate the preview functionality.`,
    blocks_content: [
      {
        id: '1',
        type: 'text',
        content: `Demo document for token: ${token}`,
        order: 0
      },
      {
        id: '2',
        type: 'text',
        content: `Reason: ${reason}`,
        order: 1
      },
      {
        id: '3',
        type: 'text',
        content: 'This is a fallback document to demonstrate the preview functionality.',
        order: 2
      },
      {
        id: '4',
        type: 'text',
        content: 'The preview page is working correctly!',
        order: 3
      }
    ],
    type: 'document' as const,
    parent_id: null,
    order_index: 0,
    is_public: true,
    share_children: false,
    preview_token: token,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return [demoDocument]
}