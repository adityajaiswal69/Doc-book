"use client"

import Editor from "./Editor"

interface DocumentProps {
  documentId?: string;
  id?: string; // For backward compatibility
  initialContent?: string;
  initialBlocksContent?: any;
  isReadOnly?: boolean;
}

const Document = ({ 
  documentId, 
  id, 
  initialContent, 
  initialBlocksContent, 
  isReadOnly = false 
}: DocumentProps) => {
  const docId = documentId || id;
  
  return (
    <div className="h-full w-full flex flex-col">
      <Editor 
        documentId={docId}
        initialContent={initialContent}
        initialBlocksContent={initialBlocksContent}
        isReadOnly={isReadOnly}
      />
    </div>
  )
}

export default Document