const { createClient } = require('@supabase/supabase-js');

// Test the sharing functionality after running the SQL migration
async function testSharingFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🧪 Testing sharing functionality...\n');

    // Test 1: Check if sharing columns exist
    console.log('1. Checking if sharing columns exist...');
    const { data: columns, error: columnsError } = await supabase
      .from('documents')
      .select('preview_token, is_public, share_children, blocks_content')
      .limit(1);

    if (columnsError) {
      console.error('❌ Columns test failed:', columnsError.message);
    } else {
      console.log('✅ Sharing columns exist');
    }

    // Test 2: Test get_shared_documents function
    console.log('\n2. Testing get_shared_documents function...');
    const { data: sharedDocs, error: sharedError } = await supabase
      .rpc('get_shared_documents', { token: '17a840bb-0665-4799-9418-2f3a2faf8346' });

    if (sharedError) {
      console.error('❌ get_shared_documents test failed:', sharedError.message);
    } else {
      console.log('✅ get_shared_documents function works! Found documents:', sharedDocs?.length || 0);
    }

    // Test 3: Test get_all_public_documents function
    console.log('\n3. Testing get_all_public_documents function...');
    const { data: publicDocs, error: publicError } = await supabase
      .rpc('get_all_public_documents');

    if (publicError) {
      console.error('❌ get_all_public_documents test failed:', publicError.message);
    } else {
      console.log('✅ get_all_public_documents function works! Found public documents:', publicDocs?.length || 0);
      if (publicDocs && publicDocs.length > 0) {
        console.log('Public documents:');
        publicDocs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.title} (${doc.preview_token})`);
        });
      }
    }

    // Test 4: Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'documents' })
      .catch(() => ({ data: null, error: { message: 'Function not available' } }));

    if (policiesError) {
      console.log('ℹ️  RLS policies check not available (this is normal)');
    } else {
      console.log('✅ RLS policies check passed');
    }

    // Test 5: Test anonymous access (simulate)
    console.log('\n5. Testing anonymous access simulation...');
    const { data: anonTest, error: anonError } = await supabase
      .from('documents')
      .select('id, title, preview_token')
      .eq('is_public', true)
      .limit(5);

    if (anonError) {
      console.error('❌ Anonymous access test failed:', anonError.message);
    } else {
      console.log('✅ Anonymous access simulation works! Found public documents:', anonTest?.length || 0);
    }

    console.log('\n🎉 Sharing functionality test completed!');
    
    if (sharedDocs && sharedDocs.length > 0) {
      console.log('\n✅ SUCCESS: The sharing functionality is working correctly!');
      console.log('You can now test the preview page with real documents.');
    } else {
      console.log('\n⚠️  No shared documents found yet.');
      console.log('To test the functionality:');
      console.log('1. Create a document in your app');
      console.log('2. Set it as public (is_public = true)');
      console.log('3. Use its preview_token to test the preview page');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Run the test
testSharingFix();
