"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  MoreHorizontal,
  Edit3,
  Trash2,
  FolderPlus,
  GripVertical,
  Share2,
  Link,
  Eye
} from "lucide-react";
import { DocumentNode } from "@/types/database";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DocumentTreeProps {
  documents: DocumentNode[];
  onCreateDocument: (parentId?: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onDeleteDocument: (id: string, title: string) => void;
  onRenameDocument: (id: string, newTitle: string) => void;
  onMoveDocument?: (docId: string, newParentId: string | null) => void;
  onShareDocument?: (id: string, scope: 'document' | 'folder') => void;
  onRevokeShare?: (id: string) => void;
  currentDocumentId?: string;
}

export default function DocumentTree({
  documents,
  onCreateDocument,
  onCreateFolder,
  onDeleteDocument,
  onRenameDocument,
  onMoveDocument,
  onShareDocument,
  onRevokeShare,
  currentDocumentId
}: DocumentTreeProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<DocumentNode | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | 'inside'>('inside');
  const router = useRouter();

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleDocumentClick = (docId: string) => {
    router.push(`/doc/${docId}`);
  };

  const startEditing = (doc: DocumentNode) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    
    try {
      await onRenameDocument(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle("");
    } catch (error) {
      toast.error("Failed to rename document");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, doc: DocumentNode) => {
    setDraggedItem(doc);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', doc.id);
  };

  const handleDragOver = (e: React.DragEvent, doc: DocumentNode) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedItem || draggedItem.id === doc.id) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    if (doc.type === 'folder') {
      // For folders, check if we're hovering over the folder itself or near edges
      if (y < height * 0.3) {
        setDragOverPosition('before');
        setDragOverItem(doc.id);
      } else if (y > height * 0.7) {
        setDragOverPosition('after');
        setDragOverItem(doc.id);
      } else {
        setDragOverPosition('inside');
        setDragOverItem(doc.id);
      }
    } else {
      // For documents, only allow before/after positioning
      if (y < height / 2) {
        setDragOverPosition('before');
        setDragOverItem(doc.id);
      } else {
        setDragOverPosition('after');
        setDragOverItem(doc.id);
      }
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
    setDragOverPosition('inside');
  };

  const handleDrop = async (e: React.DragEvent, targetDoc: DocumentNode) => {
    e.preventDefault();
    
    if (!draggedItem || !onMoveDocument) return;
    
    try {
      let newParentId: string | null = null;
      
      if (dragOverPosition === 'inside' && targetDoc.type === 'folder') {
        // Drop inside the folder
        newParentId = targetDoc.id;
      } else if (dragOverPosition === 'before' || dragOverPosition === 'after') {
        // Drop before or after the target document
        // Find the parent of the target document
        const findParent = (docs: DocumentNode[], targetId: string): string | null => {
          for (const doc of docs) {
            if (doc.children) {
              for (const child of doc.children) {
                if (child.id === targetId) {
                  return doc.id;
                }
              }
              const found = findParent(doc.children, targetId);
              if (found) return found;
            }
          }
          return null;
        };
        newParentId = findParent(documents, targetDoc.id);
      }
      
      if (newParentId !== draggedItem.parent_id) {
        await onMoveDocument(draggedItem.id, newParentId);
        toast.success('Document moved successfully');
      }
    } catch (error) {
      toast.error('Failed to move document');
    } finally {
      setDraggedItem(null);
      setDragOverItem(null);
      setDragOverPosition('inside');
    }
  };

  const renderDocumentItem = (doc: DocumentNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(doc.id);
    const isCurrentDocument = doc.id === currentDocumentId;
    const isEditing = editingId === doc.id;
    const isDragging = draggedItem?.id === doc.id;
    const isDragOver = dragOverItem === doc.id;

    const getDragOverStyles = () => {
      if (!isDragOver) return {};
      
      switch (dragOverPosition) {
        case 'before':
          return { borderTop: '2px solid #3b82f6' };
        case 'after':
          return { borderBottom: '2px solid #3b82f6' };
        case 'inside':
          return doc.type === 'folder' ? { backgroundColor: 'rgba(59, 130, 246, 0.1)' } : {};
        default:
          return {};
      }
    };

    return (
      <div key={doc.id} className="w-full">
        <div 
          className={`
            group flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent/50 cursor-pointer
            ${isCurrentDocument ? 'bg-accent text-accent-foreground' : ''}
            ${isDragging ? 'opacity-50' : ''}
            ${isDragOver ? 'ring-2 ring-blue-500' : ''}
          `}
          style={{ 
            marginLeft: level > 0 ? `${level * 16}px` : '0',
            ...getDragOverStyles()
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, doc)}
          onDragOver={(e) => handleDragOver(e, doc)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, doc)}
        >
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
          </div>

          {/* Folder toggle or document icon */}
          {doc.type === 'folder' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(doc.id);
              }}
              className="p-1 hover:bg-accent rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="w-5" /> // Spacer for alignment
          )}

          {/* Icon */}
          <div className="relative">
            {doc.type === 'folder' ? (
              <Folder className="h-4 w-4 text-blue-500" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
            {doc.is_shared && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800" title="Publicly shared" />
            )}
          </div>

          {/* Title or Edit Input */}
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveEdit}
              className="h-6 text-sm flex-1"
              autoFocus
            />
          ) : (
            <span 
              className="flex-1 text-sm truncate"
              onClick={() => doc.type === 'document' && handleDocumentClick(doc.id)}
            >
              {doc.title || 'Untitled'}
            </span>
          )}

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            {doc.type === 'folder' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFolder(doc.id);
                }}
                className="h-6 w-6 p-0 hover:bg-accent"
              >
                <FolderPlus className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCreateDocument(doc.type === 'folder' ? doc.id : undefined);
              }}
              className="h-6 w-6 p-0 hover:bg-accent"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                startEditing(doc);
              }}
              className="h-6 w-6 p-0 hover:bg-accent"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            {/* Sharing buttons */}
            {onShareDocument && onRevokeShare && (
              <>
                {doc.is_shared ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevokeShare(doc.id);
                    }}
                    className="h-6 w-6 p-0 hover:bg-accent text-orange-500 hover:text-orange-700"
                    title="Stop sharing"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareDocument(doc.id, doc.type === 'folder' ? 'folder' : 'document');
                    }}
                    className="h-6 w-6 p-0 hover:bg-accent"
                    title="Share publicly"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDocument(doc.id, doc.title || 'Untitled');
              }}
              className="h-6 w-6 p-0 hover:bg-accent text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Render children if folder is expanded */}
        {doc.type === 'folder' && isExpanded && doc.children && (
          <div>
            {doc.children.map(child => renderDocumentItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Build hierarchical structure
  const buildTree = (docs: DocumentNode[]): DocumentNode[] => {
    const docMap = new Map<string, DocumentNode>();
    const roots: DocumentNode[] = [];

    // First pass: create map of all documents
    docs.forEach(doc => {
      docMap.set(doc.id, { ...doc, children: [] });
    });

    // Second pass: build tree structure
    docs.forEach(doc => {
      const node = docMap.get(doc.id)!;
      if (doc.parent_id) {
        const parent = docMap.get(doc.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort by order_index
    const sortNodes = (nodes: DocumentNode[]) => {
      nodes.sort((a, b) => a.order_index - b.order_index);
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(roots);
    return roots;
  };

  const treeData = buildTree(documents);

  return (
    <div className="w-full space-y-1">
      {treeData.map(doc => renderDocumentItem(doc))}
    </div>
  );
}
