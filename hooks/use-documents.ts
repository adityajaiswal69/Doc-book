import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Document, UserRoom } from '@/types/database'
import { useUser } from '@clerk/nextjs'

export function useDocuments() {
  const { user } = useUser()
  const [documents, setDocuments] = useState<Document[]>([])
  const [userRooms, setUserRooms] = useState<UserRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.emailAddresses[0]?.emailAddress) return

    const fetchDocuments = async () => {
      try {
        setLoading(true)
        
        // Fetch user rooms (permissions)
        const { data: userRoomsData, error: userRoomsError } = await supabase
          .from('user_rooms')
          .select('*')
          .eq('user_id', user.emailAddresses[0].emailAddress)

        if (userRoomsError) throw userRoomsError

        setUserRooms(userRoomsData || [])

        // Fetch documents for rooms user has access to
        if (userRoomsData && userRoomsData.length > 0) {
          const roomIds = userRoomsData.map(ur => ur.room_id)
          
          const { data: documentsData, error: documentsError } = await supabase
            .from('documents')
            .select('*')
            .in('id', roomIds)

          if (documentsError) throw documentsError
          setDocuments(documentsData || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()

    // Set up real-time subscription
    const channel = supabase
      .channel('documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        () => {
          fetchDocuments()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_rooms'
        },
        () => {
          fetchDocuments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.emailAddresses])

  return { documents, userRooms, loading, error }
}

export function useDocument(id: string) {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchDocument = async () => {
      try {
        setLoading(true)
        
        const { data, error: fetchError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError
        setDocument(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()

    // Set up real-time subscription for this document
    const channel = supabase
      .channel(`document_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setDocument(payload.new as Document)
          } else if (payload.eventType === 'DELETE') {
            setDocument(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  return { document, loading, error }
}
