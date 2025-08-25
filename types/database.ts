export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          title: string
          content: string
          content_backup?: string
          blocks_content?: any
          type: 'document' | 'folder'
          parent_id: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string
          content_backup?: string
          blocks_content?: any
          type?: 'document' | 'folder'
          parent_id?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          content_backup?: string
          blocks_content?: any
          type?: 'document' | 'folder'
          parent_id?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_rooms: {
        Row: {
          id: string
          user_id: string
          room_id: string
          role: 'owner' | 'editor'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          room_id: string
          role?: 'owner' | 'editor'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          room_id?: string
          role?: 'owner' | 'editor'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Document = Database['public']['Tables']['documents']['Row']
export type UserRoom = Database['public']['Tables']['user_rooms']['Row']
export type NewDocument = Database['public']['Tables']['documents']['Insert']
export type NewUserRoom = Database['public']['Tables']['user_rooms']['Insert']

// New types for hierarchical structure
export interface DocumentNode {
  id: string
  title: string
  type: 'document' | 'folder'
  parent_id: string | null
  order_index: number
  children?: DocumentNode[]
  isExpanded?: boolean
}
