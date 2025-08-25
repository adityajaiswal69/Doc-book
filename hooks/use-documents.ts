import { useEffect, useState, useCallback } from 'react'
import { Document, UserRoom, DocumentNode } from '@/types/database'
import { getDocuments } from '@/actions/actions'
import { useAuth } from '@/components/auth/AuthProvider'

export function useDocuments() {
  const { user, loading: authLoading, session } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [userRooms, setUserRooms] = useState<UserRoom[]>([])
  const [loading, setLoading] = useState(false) // Changed from true to false
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // Track initial load

  const fetchDocuments = useCallback(async () => {
    if (!user?.id) return
    
    try {
      console.log('Starting to fetch documents...')
      setLoading(true)
      setError(null)
      
      const userId = user.id
      console.log('Fetching documents for user:', userId)
      
      const result = await getDocuments(userId)
      
      console.log('Documents fetched successfully:', result.documents?.length || 0)
      console.log('User rooms fetched successfully:', result.userRooms?.length || 0)
      
      setDocuments(result.documents || [])
      setUserRooms(result.userRooms || [])
      setIsInitialLoad(false)
    } catch (err) {
      console.error('Error in fetchDocuments:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setDocuments([])
      setUserRooms([])
      setIsInitialLoad(false)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    console.log('useDocuments effect - authLoading:', authLoading, 'user:', user?.id, 'session:', !!session)
    
    if (authLoading) {
      console.log('Auth still loading, waiting...')
      return
    }
    
    if (!user?.id || !session) {
      console.log('No user ID or session, clearing documents')
      setLoading(false)
      setDocuments([])
      setUserRooms([])
      setIsInitialLoad(false)
      return
    }

    // Only show loading on initial load
    if (isInitialLoad) {
      setLoading(true)
    }
    fetchDocuments()

    // Only fetch on mount and when user/session changes
    // Removed aggressive polling to prevent interference with editing
  }, [user?.id, authLoading, session, fetchDocuments, isInitialLoad])

  // Function to refresh documents after changes
  const refreshDocuments = useCallback(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Function to update a document in the local state
  const updateDocumentInState = useCallback((updatedDoc: Document) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === updatedDoc.id ? updatedDoc : doc
    ))
  }, [])

  // Function to add a new document to the local state
  const addDocumentToState = useCallback((newDoc: Document) => {
    setDocuments(prev => [...prev, newDoc])
  }, [])

  // Function to remove a document from the local state
  const removeDocumentFromState = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
  }, [])

  return { 
    documents, 
    userRooms, 
    loading: loading && isInitialLoad, // Only show loading on initial load
    error, 
    refetch: fetchDocuments,
    refreshDocuments,
    updateDocumentInState,
    addDocumentToState,
    removeDocumentFromState
  }
}

export function useDocument(id: string) {
  const { user } = useAuth()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false) // Changed from true to false
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSavedDocument, setLastSavedDocument] = useState<Document | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // Track initial load

  const fetchDocument = useCallback(async () => {
    if (!id || !user?.id) {
      console.log('No document ID or user ID provided')
      return
    }

    try {
      console.log('Starting to fetch document:', id)
      setLoading(true)
      setError(null)
      
      const { getDocument } = await import('@/actions/actions')
      const result = await getDocument(id, user.id)
      
      console.log('Document fetched successfully:', result.document)
      
      // Only update if the document has actually changed
      if (!lastSavedDocument || 
          lastSavedDocument.title !== result.document.title ||
          lastSavedDocument.content !== result.document.content ||
          lastSavedDocument.updated_at !== result.document.updated_at) {
        setDocument(result.document)
        setLastSavedDocument(result.document)
      }
      
      // Mark initial load as complete
      setIsInitialLoad(false)
    } catch (err) {
      console.error('Error in fetchDocument:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsInitialLoad(false)
    } finally {
      setLoading(false)
    }
  }, [id, user?.id, lastSavedDocument])

  useEffect(() => {
    // Only show loading on initial load, not on subsequent fetches
    if (isInitialLoad) {
      setLoading(true)
    }
    fetchDocument()
  }, [fetchDocument, isInitialLoad])

  const saveDocument = useCallback(async (updates: { title?: string; content?: string }) => {
    if (!id || !user?.id) return
    
    try {
      setSaving(true)
      const { updateDocument } = await import('@/actions/actions')
      const result = await updateDocument(id, updates, user.id)
      
      setDocument(result.document)
      setLastSavedDocument(result.document)
      return result.document
    } catch (err) {
      console.error('Error saving document:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [id, user?.id])

  return { 
    document, 
    loading: loading && isInitialLoad, // Only show loading on initial load
    error, 
    saving, 
    saveDocument,
    refetch: fetchDocument
  }
}
