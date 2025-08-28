# User Name Storage Fix

## Problem
The user's name was not being stored properly in the Supabase database after signup. While the name was being passed to Supabase Auth's user metadata, there was no corresponding profiles table to persist this information.

## Solution
Created a comprehensive solution that includes:

1. **Profiles Table**: Added a new `profiles` table to store user metadata including name, email, and avatar
2. **Database Trigger**: Automatic profile creation when new users sign up
3. **OAuth Support**: Profile creation for OAuth signups (Google, etc.)
4. **TypeScript Types**: Updated database types to include the profiles table

## Files Changed

### New Files
- `sql/add-profiles-table.sql` - Database migration script
- `run-profiles-migration.js` - Migration runner script
- `PROFILES_FIX.md` - This documentation

### Modified Files
- `types/database.ts` - Added profiles table types
- `components/auth/AuthForm.tsx` - Enhanced signup to include both `name` and `full_name` in metadata
- `app/auth/callback/route.ts` - Added profile creation for OAuth users

## How to Apply the Fix

### Step 1: Run Database Migration
Execute the SQL migration to create the profiles table:

```bash
# Option 1: Run the migration script
node run-profiles-migration.js

# Option 2: Manual execution
# 1. Go to your Supabase project dashboard
# 2. Navigate to SQL Editor
# 3. Copy and paste the content of sql/add-profiles-table.sql
# 4. Execute the SQL
```

### Step 2: Test the Fix
1. Try signing up a new user with an email/password
2. Check that the name appears in the `profiles` table
3. Test OAuth signup (Google) to ensure profile is created
4. Verify existing users can still sign in

## What This Fix Provides

### Database Structure
- `profiles` table with columns: `id`, `email`, `name`, `avatar_url`, `created_at`, `updated_at`
- Row Level Security (RLS) policies for data protection
- Automatic trigger to create profiles for new users

### Auth Flow Enhancement
- Email/password signup now stores name in both auth metadata and profiles table
- OAuth signup automatically creates profile with available metadata
- Fallback to email username if no name is provided

### Type Safety
- Full TypeScript support for the profiles table
- Proper types for Insert, Update, and Select operations

## Usage After Fix

### Accessing User Profile Data
```typescript
// Get current user's profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()

// Update user profile
const { error } = await supabase
  .from('profiles')
  .update({ name: 'New Name' })
  .eq('id', user.id)
```

### Profile Data Structure
```typescript
type Profile = {
  id: string          // User ID from auth.users
  email: string | null
  name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}
```

## Benefits
- ✅ User names are now properly stored and persistent
- ✅ Works for both email/password and OAuth signups
- ✅ Automatic profile creation via database triggers
- ✅ Type-safe database operations
- ✅ Follows Supabase best practices with RLS
- ✅ Maintains existing functionality

The fix ensures that user names are reliably stored in the database and can be retrieved for display in the application.
