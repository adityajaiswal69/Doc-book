# Hierarchical Document Structure Setup

This guide explains how to set up and use the new hierarchical document structure that allows you to organize documents in folders, similar to Notion.

## Features

- **Folders**: Create folders to organize your documents
- **Nested Structure**: Create folders within folders for deep organization
- **Document Management**: Create, rename, and delete documents and folders
- **Drag & Drop**: Intuitive interface for organizing content
- **Real-time Updates**: Changes appear immediately in the sidebar
- **Search**: Search through all documents regardless of folder structure

## Database Migration

Before using the new features, you need to run a database migration to add the required fields.

### Option 1: Automatic Migration Script

1. Make sure you have the required environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the migration script:
   ```bash
   npm run migrate:hierarchical
   ```

### Option 2: Manual SQL Migration

If the automatic script doesn't work, you can run the SQL manually in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-migration-hierarchical.sql`
4. Execute the SQL

## New Database Schema

The migration adds these new fields to the `documents` table:

- `type`: Either 'document' or 'folder'
- `parent_id`: Reference to parent folder (NULL for root level)
- `order_index`: Order for sorting within parent folder

## Usage

### Creating Folders

1. Click the folder icon (📁) in the sidebar to create a new folder
2. Folders can be created at the root level or within other folders
3. Click the folder icon next to an existing folder to create a subfolder

### Creating Documents

1. Click the plus icon (+) to create a new document
2. Documents can be created at the root level or within folders
3. Click the plus icon next to a folder to create a document inside it

### Organizing Content

- **Expand/Collapse**: Click the chevron (▶️) next to folders to expand or collapse them
- **Rename**: Click the edit icon (✏️) to rename documents or folders
- **Delete**: Click the trash icon (🗑️) to delete documents or folders
- **Reorder**: Documents and folders are automatically ordered by creation time

### Drag and Drop

- **Drag Handle**: Hover over any document/folder to see the grip handle (⋮⋮)
- **Drop Zones**: 
  - **Inside folders**: Drop documents inside folders to organize them
  - **Before/After**: Drop documents before or after other items to reorder them
- **Visual Feedback**: 
  - Dragged items become semi-transparent
  - Drop zones show blue borders or highlights
  - Real-time updates in the sidebar

### Navigation

- Click on document names to open them in the editor
- The current document is highlighted in the sidebar
- Use the search bar to find documents across all folders

## Component Structure

### DocumentTree Component

The main component that renders the hierarchical structure:

```tsx
<DocumentTree
  documents={documents}
  onCreateDocument={handleCreateDocument}
  onCreateFolder={handleCreateFolder}
  onDeleteDocument={handleDeleteDocument}
  onRenameDocument={handleRenameDocument}
  onMoveDocument={handleMoveDocument}
  currentDocumentId={currentDocumentId}
/>
```

### Actions

New server actions for managing the hierarchical structure:

- `createFolder(userId, parentId?)`: Creates a new folder
- `createDocumentInFolder(userId, parentId?)`: Creates a document in a specific folder
- `renameDocument(documentId, newTitle, userId)`: Renames a document or folder
- `moveDocument(documentId, newParentId, userId)`: Moves a document to a new location

## Real-time Updates

The sidebar now updates in real-time when you:

- **Create** new documents or folders
- **Rename** existing items
- **Delete** documents or folders
- **Move** items using drag and drop

All changes are reflected immediately without needing to refresh the page.

## Migration Notes

- Existing documents will automatically be set to type 'document'
- All documents will be placed at the root level initially
- The `order_index` is set based on creation timestamp
- No data loss occurs during migration

## Testing

After setup, you can test the functionality:

```bash
# Test the hierarchical structure
npm run test:hierarchical

# Test drag and drop functionality
npm run test:dragdrop
```

## Troubleshooting

### Migration Fails

If the migration fails:

1. Check that you have the correct environment variables
2. Ensure your Supabase service role key has sufficient permissions
3. Try running the SQL manually in the Supabase dashboard

### Documents Not Showing

If documents don't appear after migration:

1. Refresh the page
2. Check the browser console for errors
3. Verify the migration completed successfully

### Drag and Drop Not Working

If drag and drop doesn't work:

1. Make sure you're hovering over the grip handle (⋮⋮) that appears on hover
2. Check that the `onMoveDocument` prop is passed to DocumentTree
3. Verify the moveDocument action is properly imported

### Performance Issues

For large numbers of documents:

1. The system automatically creates indexes for better performance
2. Consider organizing documents into logical folder structures
3. Use the search function to quickly find specific documents

## Future Enhancements

Planned features for future versions:

- **Enhanced Drag & Drop**: Multi-select and bulk operations
- **Bulk Operations**: Move, delete, rename multiple items
- **Folder Templates**: Pre-configured folder structures
- **Advanced Search Filters**: Filter by type, date, tags
- **Document Versioning**: Track changes over time
- **Collaborative Editing**: Real-time collaboration within folders
- **Keyboard Shortcuts**: Quick navigation and operations

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your database schema matches the expected structure
3. Ensure all environment variables are correctly set
4. Check the Supabase logs for server-side errors
5. Test the basic functionality with the provided test scripts
