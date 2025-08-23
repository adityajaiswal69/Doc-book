# Setup Instructions

## 1. Clear Browser Cookies

**Important:** You must clear your browser cookies for localhost to remove the old Clerk authentication.

### Chrome/Edge:
1. Open Developer Tools (F12)
2. Go to **Application** tab
3. Find **Cookies** in the left sidebar
4. Select `localhost`
5. Delete all cookies, especially these Clerk-related ones:
   - `__clerk_db_jwt`
   - `__clerk_db_jwt_HSjccTNN`
   - `__refresh_HSjccTNN`
   - `clerk_active_context`
   - `__session`
   - `__session_HSjccTNN`
   - `__client_uat_HSjccTNN`
   - `__client_uat`

### Firefox:
1. Open Developer Tools (F12)
2. Go to **Storage** tab
3. Find **Cookies** in the left sidebar
4. Select `localhost`
5. Delete all cookies

## 2. Create Environment File

1. Copy the template file:
   ```bash
   cp env.template .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   
   # Liveblocks Configuration (keep existing)
   LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key_here
   ```

## 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-migration.sql`
4. Run the migration to create the necessary tables and policies

## 4. Restart Development Server

```bash
npm run dev
```

## 5. Test the Application

1. Open http://localhost:3000
2. You should see the Supabase authentication form
3. Sign up with a new account or sign in with existing credentials
4. The test component will show you if authentication is working

## Troubleshooting

### If you still see "No active session found":
- Make sure you've cleared ALL browser cookies for localhost
- Verify your `.env.local` file has the correct Supabase credentials
- Check that your Supabase database has the correct tables and policies

### If you see import errors:
- The server needs to be restarted after making changes
- Run `npm run dev` again

### If authentication works but documents don't load:
- Check that your Supabase RLS policies are set up correctly
- Verify the `user_rooms` table exists and has the correct structure
