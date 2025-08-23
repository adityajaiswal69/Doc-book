import { useEffect, useState, useCallback } from 'react'
import { Document, UserRoom } from '@/types/database'
import { getDocuments } from '@/actions/actions'
import { useAuth } from '@/components/auth/AuthProvider'

export function useDocuments() {
  const { user, loading: authLoading, session } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [userRooms, setUserRooms] = useState<UserRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err) {
      console.error('Error in fetchDocuments:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setDocuments([])
      setUserRooms([])
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
      return
    }

    fetchDocuments()

    // Set up polling for real-time updates (like Notion)
    const interval = setInterval(() => {
      console.log('Polling for document updates...')
      fetchDocuments()
    }, 3000) // Poll every 3 seconds for real-time feel

    return () => {
      console.log('Cleaning up useDocuments effect')
      clearInterval(interval)
    }
  }, [user?.id, authLoading, session, fetchDocuments])

  return { documents, userRooms, loading, error, refetch: fetchDocuments }
}

export function useDocument(id: string) {
  const { user } = useAuth()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
      setDocument(result.document)
    } catch (err) {
      console.error('Error in fetchDocument:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setDocument(null)
    } finally {
      setLoading(false)
    }
  }, [id, user?.id])

  const saveDocument = useCallback(async (updates: { title?: string; content?: string }) => {
    if (!id || !user?.id) return
    
    try {
      setSaving(true)
      const { updateDocument } = await import('@/actions/actions')
      const result = await updateDocument(id, updates, user.id)
      setDocument(result.document)
      console.log('Document saved successfully')
    } catch (err) {
      console.error('Error saving document:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    fetchDocument()

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      console.log('Polling for document updates:', id)
      fetchDocument()
    }, 2000) // Poll every 2 seconds for real-time feel

    return () => {
      console.log('Cleaning up useDocument effect for:', id)
      clearInterval(interval)
    }
  }, [id, fetchDocument])

  return { document, loading, error, saving, saveDocument, refetch: fetchDocument }
}
