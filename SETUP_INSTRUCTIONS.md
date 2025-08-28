# Setup Instructions for Doc Book

## 1. Environment Variables

Create a `.env.local` file in the root directory with the following content:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Liveblocks Configuration (keep existing)
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
```

**Important:** Replace the placeholder values with your actual Supabase project credentials.

## 2. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-migration.sql`
4. Run the migration to create the necessary tables and policies

## 3. Storage Setup

**Important**: Set up the storage bucket for image uploads:

```bash
node setup-storage.js
```

This script will:
- Create the "images" storage bucket
- Configure storage policies for authentication
- Set file size limits (50MB default)
- Test the storage configuration

Alternative manual setup:
1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket named "images"
4. Set it as public
5. Configure file size limit (50MB recommended)
6. Allow MIME types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml, image/bmp

## 4. Start the Development Server

```bash
npm run dev
```

## 5. Test the Application

1. Open http://localhost:3000 in your browser
2. You should see the authentication form
3. Sign up with a new account or sign in with existing credentials
4. Create your first document
5. The document should appear in the sidebar and be editable

## Troubleshooting

### "Unauthorized - User must be logged in" Error
This usually means:
- Environment variables are not set correctly
- Database migration hasn't been run
- User is not properly authenticated

### No Documents Loading
- Check the browser console for errors
- Verify the database connection using the "Test DB Connection" button
- Ensure the user has proper permissions in the database

### Authentication Issues
- Check that Supabase Auth is enabled in your project
- Verify the callback URL is set to `http://localhost:3000/auth/callback`
- Check that Google OAuth is configured if you want to use it

## Current Status

✅ Clerk authentication removed
✅ Supabase authentication integrated
✅ Liveblocks functionality commented out
✅ Notion-like UI implemented
✅ Server actions for document management
✅ Error boundaries and debugging added
✅ Middleware for Supabase auth

The application should now work like Notion with Supabase as the backend!
