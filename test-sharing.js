const { createClient } = require('@supabase/supabase-js');

// Test the sharing functionality
async function testSharing() {
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
    console.log('🧪 Testing sharing functionality...\n');

    // Test 1: Check if new columns exist
    console.log('1. Checking database schema...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'documents')
      .in('column_name', ['preview_token', 'is_public', 'share_children']);

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return;
    }

    const expectedColumns = ['preview_token', 'is_public', 'share_children'];
    const foundColumns = columns.map(col => col.column_name);
    
    console.log('Found columns:', foundColumns);
    
    if (expectedColumns.every(col => foundColumns.includes(col))) {
      console.log('✅ All sharing columns exist\n');
    } else {
      console.log('❌ Missing columns. Please run the migration first.\n');
      return;
    }

    // Test 2: Test generate_preview_token function
    console.log('2. Testing generate_preview_token function...');
    const { data: token, error: tokenError } = await supabase
      .rpc('generate_preview_token');

    if (tokenError) {
      console.error('❌ Error generating token:', tokenError);
      return;
    }

    console.log('✅ Generated token:', token);

    // Test 3: Create a test document with sharing
    console.log('\n3. Creating test document with sharing...');
    const testDocument = {
      title: 'Test Shared Document',
      content: 'This is a test document for sharing functionality',
      type: 'document',
      is_public: true,
      share_children: false,
      preview_token: token
    };

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert(testDocument)
      .select()
      .single();

    if (docError) {
      console.error('❌ Error creating test document:', docError);
      return;
    }

    console.log('✅ Created test document:', doc.id);

    // Test 4: Test get_shared_documents function
    console.log('\n4. Testing get_shared_documents function...');
    const { data: sharedDocs, error: sharedError } = await supabase
      .rpc('get_shared_documents', { token });

    if (sharedError) {
      console.error('❌ Error getting shared documents:', sharedError);
      return;
    }

    console.log('✅ Retrieved shared documents:', sharedDocs.length);
    console.log('Document title:', sharedDocs[0]?.title);

    // Test 5: Test folder sharing
    console.log('\n5. Testing folder sharing...');
    const testFolder = {
      title: 'Test Shared Folder',
      content: 'This is a test folder',
      type: 'folder',
      is_public: true,
      share_children: true,
      preview_token: await supabase.rpc('generate_preview_token').then(r => r.data)
    };

    const { data: folder, error: folderError } = await supabase
      .from('documents')
      .insert(testFolder)
      .select()
      .single();

    if (folderError) {
      console.error('❌ Error creating test folder:', folderError);
      return;
    }

    console.log('✅ Created test folder:', folder.id);

    // Create a child document
    const childDoc = {
      title: 'Child Document',
      content: 'This is a child document',
      type: 'document',
      parent_id: folder.id,
      order_index: 0
    };

    const { data: child, error: childError } = await supabase
      .from('documents')
      .insert(childDoc)
      .select()
      .single();

    if (childError) {
      console.error('❌ Error creating child document:', childError);
      return;
    }

    console.log('✅ Created child document:', child.id);

    // Test folder sharing with children
    const { data: folderSharedDocs, error: folderSharedError } = await supabase
      .rpc('get_shared_documents', { token: folder.preview_token });

    if (folderSharedError) {
      console.error('❌ Error getting shared folder documents:', folderSharedError);
      return;
    }

    console.log('✅ Retrieved shared folder documents:', folderSharedDocs.length);
    console.log('Folder documents:', folderSharedDocs.map(d => d.title));

    // Cleanup
    console.log('\n6. Cleaning up test data...');
    await supabase.from('documents').delete().in('id', [doc.id, folder.id, child.id]);
    console.log('✅ Cleanup completed');

    console.log('\n🎉 All sharing tests passed!');
    console.log('\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Create a document and click the Share button');
    console.log('3. Test the generated preview link');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run the test
testSharing();

