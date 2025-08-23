# Database Migration Instructions

## Step 1: Go to Supabase Dashboard

1. Open your browser and go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `pegqeovfiyulglbgouqf`

## Step 2: Open SQL Editor

1. In your project dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New query"** to create a new SQL query

## Step 3: Run the Migration

Copy and paste the entire content of `supabase-migration.sql` into the SQL editor, then click **"Run"**.

## Step 4: Verify the Migration

After running the migration, run these test queries to verify everything is working:

### Test 1: Check if tables exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('documents', 'user_rooms');
```

### Test 2: Check if RLS is enabled
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('documents', 'user_rooms');
```

### Test 3: Check if policies exist
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('documents', 'user_rooms');
```

## Step 5: Test Document Creation

After the migration, try creating a document in your app. The documents should now be properly linked to users through the `user_rooms` table.

## Troubleshooting

If you see any errors:

1. **Table already exists**: This is normal, the migration uses `CREATE TABLE IF NOT EXISTS`
2. **Policy already exists**: This is normal, you can ignore these errors
3. **Permission denied**: Make sure you're using the correct database connection

## Expected Results

After successful migration:
- ✅ `documents` table exists with RLS enabled
- ✅ `user_rooms` table exists with RLS enabled  
- ✅ All policies are created
- ✅ Triggers are set up for `updated_at` timestamps
- ✅ Documents should now be properly fetched in your app
