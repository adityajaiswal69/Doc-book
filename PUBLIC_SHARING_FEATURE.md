# Public Sharing Feature

This document describes the public sharing functionality that allows users to share documents and folders publicly with view-only access.

## Overview

The public sharing feature enables document owners to generate unique, non-guessable share links for their documents and folders. These links provide view-only access to the content without requiring authentication.

## Features

### Public Share Links
- **Single Document Sharing**: Share individual documents with a unique link
- **Folder Sharing**: Share entire folders, making all contained documents publicly viewable
- **Unique Tokens**: Each share link uses a UUID-based token for security
- **View Count Tracking**: Track how many times shared content has been viewed

### Access Control
- **View-Only Access**: Public users can only view content, not edit, delete, or comment
- **No Authentication Required**: Viewers don't need to sign up or log in
- **Owner-Only Management**: Only document owners can create or revoke share links

### Security
- **Non-Guessable URLs**: Share IDs are UUIDs, making them impossible to guess
- **Immediate Revocation**: Revoking a share link immediately removes access
- **Owner Verification**: Only document owners can manage sharing

## Database Schema

### Documents Table Additions
```sql
ALTER TABLE public.documents 
ADD COLUMN is_shared boolean DEFAULT false,
ADD COLUMN share_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN shared_at timestamp with time zone,
ADD COLUMN share_scope text DEFAULT 'document' CHECK (share_scope IN ('document', 'folder'));
```

### Public Shares Table
```sql
CREATE TABLE public.public_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  share_id uuid NOT NULL UNIQUE,
  share_scope text NOT NULL DEFAULT 'document' CHECK (share_scope IN ('document', 'folder')),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  view_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone,
  CONSTRAINT public_shares_pkey PRIMARY KEY (id)
);
```

## API Endpoints

### Create Public Share
```typescript
POST /api/share
{
  documentId: string,
  scope: 'document' | 'folder'
}
```

### Revoke Public Share
```typescript
DELETE /api/share/{documentId}
```

### Get Shared Document
```typescript
GET /api/share/{shareId}
```

## URL Format

Public share URLs follow this format:
```
https://app.com/share/{shareId}
```

## UI Components

### Document Tree Integration
- **Share Button**: Appears in document/folder context menus
- **Visual Indicators**: Green dot on shared documents/folders
- **Share Status**: Shows "Stop Sharing" option for already shared items

### Share Page
- **Document Viewer**: Read-only document display
- **Folder Browser**: For shared folders, shows list of contained documents
- **Share Info**: Displays view count, share date, and access level
- **Copy Link**: Easy one-click link copying

## Usage

### Sharing a Document
1. Right-click on a document in the sidebar
2. Click the "Share" button (📤 icon)
3. Choose sharing scope (document or folder)
4. Share link is automatically copied to clipboard
5. Green dot appears on the document indicating it's shared

### Sharing a Folder
1. Right-click on a folder in the sidebar
2. Click the "Share" button
3. Choose "folder" scope to share all contained documents
4. Share link provides access to the folder and all its contents

### Stopping Sharing
1. Right-click on a shared document/folder
2. Click the "Stop Sharing" button (👁️ icon)
3. Share link is immediately revoked

### Viewing Shared Content
1. Open a share link in any browser
2. Content loads in read-only mode
3. For folders, click on documents to view their contents
4. No authentication required

## Implementation Details

### Database Functions
- `create_public_share(document_id, scope)`: Creates a new public share
- `revoke_public_share(document_id)`: Removes a public share
- `get_shared_document(share_id)`: Retrieves shared document data
- `get_user_shared_documents(user_id)`: Gets all shares for a user

### Security Considerations
- Share IDs are UUIDs generated using `gen_random_uuid()`
- Only document owners can create/revoke shares
- View count is tracked for analytics
- Expiration dates can be set for temporary shares

### Performance
- Indexes on `share_id` and `is_shared` columns
- Efficient queries for share lookups
- Minimal impact on existing document operations

## Migration

To set up the public sharing feature, run:

```bash
npm run migrate:sharing
```

This will:
1. Add sharing columns to the documents table
2. Create the public_shares table
3. Add necessary indexes
4. Create database functions for share management

## Future Enhancements

- **Expiration Dates**: Set automatic expiration for share links
- **Password Protection**: Add optional password protection for shares
- **Analytics Dashboard**: View detailed analytics for shared content
- **Bulk Operations**: Share multiple documents at once
- **Custom Domains**: Use custom domains for share links
