const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFolderSharing() {
  console.log('🧪 Testing folder sharing...');
  
  try {
    // Step 1: Create a test folder
    console.log('\n1️⃣ Creating test folder...');
    const { data: testFolder, error: createFolderError } = await supabase
      .from('documents')
      .insert({
        title: 'Test Shared Folder',
        content: 'This is a test folder for sharing.',
        type: 'folder'
      })
      .select()
      .single();
    
    if (createFolderError) {
      console.error('❌ Error creating test folder:', createFolderError);
      return;
    }
    
    console.log('✅ Test folder created:', testFolder.id);
    
    // Step 2: Create a nested folder
    console.log('\n2️⃣ Creating nested folder...');
    const { data: nestedFolder, error: createNestedError } = await supabase
      .from('documents')
      .insert({
        title: 'Nested Folder',
        content: 'This is a nested folder.',
        type: 'folder',
        parent_id: testFolder.id,
        order_index: 0
      })
      .select()
      .single();
    
    if (createNestedError) {
      console.error('❌ Error creating nested folder:', createNestedError);
      return;
    }
    
    console.log('✅ Nested folder created:', nestedFolder.id);
    
    // Step 3: Create documents inside the nested folder
    console.log('\n3️⃣ Creating documents in nested folder...');
    const { data: doc1, error: createDoc1Error } = await supabase
      .from('documents')
      .insert({
        title: 'Document 1',
        content: 'This is document 1 inside the nested folder.\n\n# Heading\nThis is some content.\n\n- List item 1\n- List item 2',
        type: 'document',
        parent_id: nestedFolder.id,
        order_index: 0
      })
      .select()
      .single();
    
    if (createDoc1Error) {
      console.error('❌ Error creating document 1:', createDoc1Error);
      return;
    }
    
    const { data: doc2, error: createDoc2Error } = await supabase
      .from('documents')
      .insert({
        title: 'Document 2',
        content: 'This is document 2 inside the nested folder.\n\n## Subheading\nMore content here.',
        type: 'document',
        parent_id: nestedFolder.id,
        order_index: 1
      })
      .select()
      .single();
    
    if (createDoc2Error) {
      console.error('❌ Error creating document 2:', createDoc2Error);
      return;
    }
    
    console.log('✅ Documents created in nested folder');
    
    // Step 4: Create a document directly in the main folder
    console.log('\n4️⃣ Creating document in main folder...');
    const { data: mainDoc, error: createMainDocError } = await supabase
      .from('documents')
      .insert({
        title: 'Main Document',
        content: 'This is a document directly in the main shared folder.\n\nThis should be accessible when the folder is shared.',
        type: 'document',
        parent_id: testFolder.id,
        order_index: 1
      })
      .select()
      .single();
    
    if (createMainDocError) {
      console.error('❌ Error creating main document:', createMainDocError);
      return;
    }
    
    console.log('✅ Main document created');
    
    // Step 5: Create a test user room (simulating ownership)
    console.log('\n5️⃣ Creating user room...');
    const { error: userRoomError } = await supabase
      .from('user_rooms')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy user ID
        room_id: testFolder.id,
        role: 'owner'
      });
    
    if (userRoomError) {
      console.error('❌ Error creating user room:', userRoomError);
      return;
    }
    
    console.log('✅ User room created');
    
    // Step 6: Create a public share for the folder
    console.log('\n6️⃣ Creating public share for folder...');
    const { data: shareResult, error: shareError } = await supabase
      .rpc('create_public_share', {
        p_document_id: testFolder.id,
        p_share_scope: 'folder'
      });
    
    if (shareError) {
      console.error('❌ Error creating public share:', shareError);
      return;
    }
    
    console.log('✅ Public share created:', shareResult);
    
    // Step 7: Test retrieving the shared folder
    console.log('\n7️⃣ Testing shared folder retrieval...');
    const { data: sharedFolder, error: retrieveError } = await supabase
      .rpc('get_shared_document', {
        p_share_id: shareResult.share_id
      });
    
    if (retrieveError) {
      console.error('❌ Error retrieving shared folder:', retrieveError);
      return;
    }
    
    console.log('✅ Shared folder retrieved successfully');
    console.log('Folder title:', sharedFolder.document.title);
    console.log('Children count:', sharedFolder.children.length);
    console.log('Share ID:', shareResult.share_id);
    
    // Step 8: Generate the share URL
    const shareUrl = `http://localhost:3000/share/${shareResult.share_id}`;
    console.log('\n🎉 Share URL:', shareUrl);
    console.log('\nYou can now test this URL in your browser!');
    console.log('This should show:');
    console.log('- The main folder with its contents');
    console.log('- A nested folder that you can click into');
    console.log('- Documents that you can view in read-only mode');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFolderSharing();
