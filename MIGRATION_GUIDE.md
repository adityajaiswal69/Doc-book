# Firebase to Supabase Migration Guide

This guide will help you migrate your Doc-books project from Firebase to Supabase.

## Overview

The migration involves:
- Replacing Firebase Firestore with Supabase PostgreSQL
- Updating all database queries and real-time subscriptions
- Maintaining the same functionality with improved performance and features

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in Supabase
3. Get your project URL and API keys

## Step 1: Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration script from `supabase-migration.sql`:

```sql
-- Copy and paste the entire content of supabase-migration.sql
```

This will create:
- `documents` table for storing document metadata
- `user_rooms` table for user permissions
- Row Level Security (RLS) policies
- Indexes for optimal performance
- Automatic timestamp updates

## Step 2: Configure Environment Variables

1. Copy `env.example` to `.env.local`
2. Fill in your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Keep your existing Clerk and Liveblocks keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
LIVEBLOCKS_SECRET_KEY=your_liveblocks_key
```

## Step 3: Install Dependencies

```bash
npm install @supabase/supabase-js
npm uninstall firebase firebase-admin react-firebase-hooks
```

## Step 4: Update Your Code

The migration has already been completed in the following files:

### Database Configuration
- ✅ `lib/supabase.ts` - Supabase client configuration
- ✅ `types/database.ts` - TypeScript types for database schema

### Custom Hooks
- ✅ `hooks/use-documents.ts` - Replaces Firebase hooks with Supabase

### Components
- ✅ `components/app-sidebar.tsx` - Updated to use Supabase
- ✅ `components/SidebarOption.tsx` - Updated to use Supabase
- ✅ `components/Header.tsx` - Updated to use Supabase

### Server Actions & API Routes
- ✅ `actions/actions.ts` - Updated to use Supabase
- ✅ `app/auth-endpoint/route.ts` - Updated to use Supabase

### Removed Files
- ❌ `firebase.ts` - Replaced with `lib/supabase.ts`
- ❌ `firebase-admin.ts` - Replaced with server-side Supabase client
- ❌ `doc-books-firebase-adminsdk-fbsvc-4870a2997a.json` - No longer needed

## Step 5: Data Migration (Optional)

If you have existing data in Firebase, you can migrate it:

1. Export your Firebase data
2. Transform the data to match the new schema
3. Import into Supabase using the SQL Editor or API

Example migration script:

```javascript
// This is a conceptual example - implement based on your data structure
const migrateData = async () => {
  // Export from Firebase
  const firebaseDocs = await firebase.firestore().collection('documents').get();
  const firebaseRooms = await firebase.firestore().collectionGroup('rooms').get();
  
  // Transform and insert into Supabase
  for (const doc of firebaseDocs.docs) {
    await supabase.from('documents').insert({
      id: doc.id,
      title: doc.data().title,
      created_at: doc.data().createdAt?.toDate().toISOString(),
      updated_at: doc.data().updatedAt?.toDate().toISOString()
    });
  }
  
  for (const room of firebaseRooms.docs) {
    await supabase.from('user_rooms').insert({
      user_id: room.data().userId,
      room_id: room.data().roomId,
      role: room.data().role,
      created_at: room.data().createdAt?.toDate().toISOString()
    });
  }
};
```

## Step 6: Test Your Application

1. Start your development server: `npm run dev`
2. Test document creation
3. Test real-time updates
4. Test user permissions
5. Test collaborative editing

## Key Differences

### Real-time Subscriptions
- **Firebase**: Uses `onSnapshot` listeners
- **Supabase**: Uses `channel().on('postgres_changes')` subscriptions

### Authentication
- **Firebase**: Built-in auth system
- **Supabase**: Uses Clerk for auth, Supabase for data

### Database Structure
- **Firebase**: NoSQL document structure
- **Supabase**: PostgreSQL relational structure

### Permissions
- **Firebase**: Security rules in JavaScript
- **Supabase**: Row Level Security (RLS) policies in SQL

## Benefits of Supabase

1. **Better Performance**: PostgreSQL is faster than Firestore for complex queries
2. **SQL Support**: Full SQL capabilities for advanced queries
3. **Real-time**: Built-in real-time subscriptions
4. **Row Level Security**: More granular permission control
5. **Database Functions**: Custom PostgreSQL functions
6. **Better TypeScript Support**: Generated types from schema
7. **Cost Effective**: More generous free tier

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure `.env.local` is in the root directory
   - Restart your development server

2. **RLS Policies Blocking Access**
   - Check that user email matches the `user_id` in `user_rooms`
   - Verify RLS policies are correctly configured

3. **Real-time Not Working**
   - Ensure you're subscribed to the correct channels
   - Check that the user has proper permissions

4. **TypeScript Errors**
   - Run `npm run build` to check for type issues
   - Update types in `types/database.ts` if needed

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

After migration, consider:

1. **Performance Optimization**: Add more indexes based on query patterns
2. **Advanced Features**: Implement database functions for complex operations
3. **Monitoring**: Set up Supabase analytics and monitoring
4. **Backup Strategy**: Configure automated backups
5. **Scaling**: Plan for horizontal scaling as your app grows
