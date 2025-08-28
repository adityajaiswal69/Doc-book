#!/usr/bin/env node

/**
 * Supabase Storage Bucket Setup Script
 * 
 * This script creates the 'images' storage bucket and sets up the necessary policies
 * for the Doc-books application to handle image uploads.
 * 
 * Usage: node setup-storage.js
 * 
 * Make sure you have the following environment variables set:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage for Doc-books...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env.local file.');
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('📋 Checking existing storage buckets...');
    
    // Check if images bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      process.exit(1);
    }

    const imagesBucket = buckets.find(bucket => bucket.name === 'images');
    
    if (imagesBucket) {
      console.log('✅ Images bucket already exists');
    } else {
      console.log('📦 Creating images storage bucket...');
      
      // Create the images bucket
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'image/bmp',
          'image/ico'
        ],
        fileSizeLimit: 52428800, // 50MB in bytes
      });

      if (bucketError) {
        console.error('❌ Error creating bucket:', bucketError.message);
        process.exit(1);
      }

      console.log('✅ Images bucket created successfully');
    }

    console.log('\n🔐 Setting up storage policies...');
    
    // Run the SQL script to set up policies
    const sqlScript = `
      -- Enable RLS on storage.objects if not already enabled
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow authenticated uploads for images" ON storage.objects;
      DROP POLICY IF EXISTS "Allow public access for images" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated updates for owned images" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated deletes for owned images" ON storage.objects;

      -- Policy: Allow authenticated users to insert images
      CREATE POLICY "Allow authenticated uploads for images" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'images' 
        AND auth.uid() IS NOT NULL
      );

      -- Policy: Allow public read access to images  
      CREATE POLICY "Allow public access for images" ON storage.objects
      FOR SELECT USING (bucket_id = 'images');

      -- Policy: Allow users to update images for documents they own
      CREATE POLICY "Allow authenticated updates for owned images" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'images' 
        AND auth.uid() IS NOT NULL
      );

      -- Policy: Allow users to delete images for documents they own
      CREATE POLICY "Allow authenticated deletes for owned images" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'images' 
        AND auth.uid() IS NOT NULL
      );
    `;

    const { error: policyError } = await supabase.rpc('exec', { sql: sqlScript });
    
    if (policyError) {
      console.log('⚠️  Note: Could not set up storage policies via script.');
      console.log('   You may need to set them up manually in the Supabase dashboard.');
      console.log('   Error:', policyError.message);
    } else {
      console.log('✅ Storage policies configured successfully');
    }

    console.log('\n🧪 Testing storage setup...');
    
    // Test creating a simple file to verify everything works
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const testPath = 'test-folder/test-file.txt';
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Storage test failed:', uploadError.message);
    } else {
      console.log('✅ Storage test successful');
      
      // Clean up test file
      await supabase.storage.from('images').remove([testPath]);
      console.log('🧹 Test file cleaned up');
    }

    console.log('\n✨ Storage setup completed successfully!');
    console.log('\n📖 Next steps:');
    console.log('   1. Run the database migration: node run-migration.js');
    console.log('   2. Start your development server: npm run dev');
    console.log('   3. Try uploading an image in your application');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  setupStorage().catch(console.error);
}

module.exports = { setupStorage };
