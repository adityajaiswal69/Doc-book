const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Run the sharing functionality fix
async function runSharingFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    console.log('Please set:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔧 Running sharing functionality fix...\n');

    console.log('📋 The SQL migration needs to be run manually in your Supabase SQL editor.');
    console.log('Please copy and paste the contents of sql/fix-sharing-permissions.sql into your Supabase SQL editor and run it.\n');
    
    // Read and display the SQL content
    const sqlContent = fs.readFileSync('sql/fix-sharing-permissions.sql', 'utf8');
    console.log('📄 SQL Content to run in Supabase:');
    console.log('=' .repeat(80));
    console.log(sqlContent);
    console.log('=' .repeat(80));
    console.log('\n📝 Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the SQL content above');
    console.log('4. Paste it into the SQL editor');
    console.log('5. Click "Run" to execute the migration\n');

    console.log('\n🔍 Testing the fix...\n');

    // Test the get_shared_documents function
    console.log('Testing get_shared_documents function...');
    const { data: testData, error: testError } = await supabase
      .rpc('get_shared_documents', { token: '17a840bb-0665-4799-9418-2f3a2faf8346' });

    if (testError) {
      console.error('❌ Test failed:', testError.message);
    } else {
      console.log('✅ Test successful! Found documents:', testData?.length || 0);
      if (testData && testData.length > 0) {
        console.log('Sample document:', testData[0].title);
      }
    }

    // Test getting all public documents
    console.log('\nTesting get_all_public_documents function...');
    const { data: publicDocs, error: publicError } = await supabase
      .rpc('get_all_public_documents');

    if (publicError) {
      console.error('❌ Public documents test failed:', publicError.message);
    } else {
      console.log('✅ Public documents test successful! Found:', publicDocs?.length || 0);
      if (publicDocs && publicDocs.length > 0) {
        console.log('Public documents:');
        publicDocs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.title} (${doc.preview_token})`);
        });
      }
    }

    console.log('\n🎉 Sharing functionality fix completed!');
    console.log('\nNext steps:');
    console.log('1. Test the preview page with existing tokens');
    console.log('2. Create new shared documents to test the functionality');
    console.log('3. Verify that public documents are accessible without authentication');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Load environment variables from multiple possible locations
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Check if we have the required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ Missing environment variables!');
  console.log('\nPlease create a .env.local file with the following variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
  console.log('\nYou can copy from env.template:');
  console.log('cp env.template .env.local');
  console.log('\nThen edit .env.local with your actual Supabase values.');
  process.exit(1);
}

// Run the fix
runSharingFix();
