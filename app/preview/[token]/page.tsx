'use client'

import { useEffect, useState } from 'react'
import { getSharedDocument } from '@/actions/actions'
import { Document } from '@/types/database'
import PreviewDocument from '@/components/PreviewDocument'
import { Loader2 } from 'lucide-react'

interface PreviewPageProps {
  params: Promise<{ token: string }>
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const resolvedParams = await params
        const tokenValue = resolvedParams.token
        setToken(tokenValue)
        
        const sharedDocs = await getSharedDocument(tokenValue)
        setDocuments(sharedDocs)
        setLoading(false)
      } catch (err) {
        console.error('Error loading shared documents:', err)
        setError(err instanceof Error ? err.message : 'Failed to load document')
        setLoading(false)
      }
    }

    loadDocuments()
  }, [params])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading shared document...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Document Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-2">No Documents Found</h1>
          <p className="text-gray-500">This shared link doesn&apos;t contain any documents.</p>
        </div>
      </div>
    )
  }

  // Find the main document (the one with the preview token)
  const mainDocument = documents.find(doc => doc.preview_token === token)
  
  // If no main document found, show error
  if (!mainDocument) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Document Not Found</h1>
          <p className="text-gray-600">No document found with the provided preview token.</p>
        </div>
      </div>
    )
  }
  
  // Get child documents if any
  const childDocuments = documents.filter(doc => doc.id !== mainDocument.id)

  return (
    <div className="h-full w-full flex flex-col">
      <PreviewDocument 
        mainDocument={mainDocument}
        childDocuments={childDocuments}
      />
    </div>
  )
}

