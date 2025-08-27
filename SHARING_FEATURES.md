# Document Sharing Features

This document outlines the new public preview and sharing functionality implemented in Note Forge.

## Overview

The sharing system allows users to create public links for their documents and folders, enabling read-only access without requiring authentication.

## Features

### 1. Public Link Generation
- Each document/folder can generate a unique preview token
- Public links follow the format: `/preview/{token}`
- Links are secure and unguessable (UUID-based)

### 2. Read-Only Preview Mode
- Identical UI to the editor but with no editing capabilities
- Live updates when the owner makes changes
- Responsive design that works on all devices

### 3. Folder Sharing
- **Single Document**: Only the shared document is visible
- **Folder with Children**: All child documents appear in the sidebar
- Hierarchical navigation within shared folders

### 4. Global Sidebar & Header
- Consistent navigation experience
- Document tree with expandable folders
- Share link management (copy, open in new tab)

## Database Schema

### New Columns Added to `documents` Table:
- `preview_token` (UUID): Unique token for public access
- `is_public` (boolean): Whether the document is publicly shared
- `share_children` (boolean): Whether to include child documents (folders only)

### Database Functions:
- `generate_preview_token()`: Creates new UUID tokens
- `get_shared_documents(token)`: Retrieves shared documents by token

## API Endpoints

### Server Actions:
- `toggleDocumentSharing(id, isPublic, shareChildren, userId)`: Toggle sharing settings
- `getSharedDocument(token)`: Get shared documents by token

## Components

### New Components:
1. **ShareButton**: UI for managing document sharing
2. **PreviewDocument**: Read-only document viewer
3. **PreviewBlockRenderer**: Simplified block rendering for preview mode
4. **PreviewLayout**: Layout for preview routes (no auth required)

### Updated Components:
- **Editor**: Added ShareButton to header
- **BlockRenderer**: Enhanced for preview mode support

## Usage

### For Document Owners:
1. Click the "Share" button in the document header
2. Toggle "Public sharing" to enable
3. For folders, optionally enable "Share children"
4. Copy the generated link or open in new tab

### For Viewers:
1. Visit the shared link (no login required)
2. Navigate through documents using the sidebar
3. View content in read-only mode
4. Copy the link to share with others

## Security

- Preview tokens are cryptographically secure UUIDs
- No authentication required for preview access
- Tokens are invalidated when sharing is disabled
- Database functions enforce access control

## File Structure

```
app/
├── preview/
│   ├── [token]/
│   │   └── page.tsx          # Preview page
│   └── layout.tsx            # Preview layout (no auth)
components/
├── ShareButton.tsx           # Sharing UI
├── PreviewDocument.tsx       # Preview viewer
├── PreviewBlockRenderer.tsx  # Read-only blocks
└── ui/
    └── switch.tsx            # Switch component
sql/
└── add-sharing-functionality.sql  # Database migration
```

## Migration

Run the database migration to add sharing functionality:

```sql
-- Execute the contents of sql/add-sharing-functionality.sql
```

## Testing

1. Create a document and enable sharing
2. Copy the generated link
3. Open in incognito/private browser
4. Verify read-only access works
5. Test folder sharing with child documents
6. Verify live updates when owner makes changes

## Future Enhancements

- Password-protected sharing
- Expiration dates for shared links
- Analytics for shared documents
- Comment system for shared documents
- Export functionality for shared content

