const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testShareCreation() {
  console.log('🧪 Testing share creation...');
  
  try {
    // Step 1: Create a test document
    console.log('\n1️⃣ Creating test document...');
    const { data: testDoc, error: createError } = await supabase
      .from('documents')
      .insert({
        title: 'Test Document for Sharing',
        content: 'This is a test document with some content.\n\n# Heading 1\nThis is a heading.\n\n- List item 1\n- List item 2\n\nThis is the end of the test document.',
        type: 'document'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating test document:', createError);
      return;
    }
    
    console.log('✅ Test document created:', testDoc.id);
    
    // Step 2: Create a test user room (simulating ownership)
    console.log('\n2️⃣ Creating user room...');
    const { error: userRoomError } = await supabase
      .from('user_rooms')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy user ID
        room_id: testDoc.id,
        role: 'owner'
      });
    
    if (userRoomError) {
      console.error('❌ Error creating user room:', userRoomError);
      return;
    }
    
    console.log('✅ User room created');
    
    // Step 3: Create a public share
    console.log('\n3️⃣ Creating public share...');
    const { data: shareResult, error: shareError } = await supabase
      .rpc('create_public_share', {
        p_document_id: testDoc.id,
        p_share_scope: 'document'
      });
    
    if (shareError) {
      console.error('❌ Error creating public share:', shareError);
      return;
    }
    
    console.log('✅ Public share created:', shareResult);
    
    // Step 4: Test retrieving the shared document
    console.log('\n4️⃣ Testing shared document retrieval...');
    const { data: sharedDoc, error: retrieveError } = await supabase
      .rpc('get_shared_document', {
        p_share_id: shareResult.share_id
      });
    
    if (retrieveError) {
      console.error('❌ Error retrieving shared document:', retrieveError);
      return;
    }
    
    console.log('✅ Shared document retrieved successfully');
    console.log('Document title:', sharedDoc.document.title);
    console.log('Document content:', sharedDoc.document.content);
    console.log('Share ID:', shareResult.share_id);
    
    // Step 5: Generate the share URL
    const shareUrl = `http://localhost:3000/share/${shareResult.share_id}`;
    console.log('\n🎉 Share URL:', shareUrl);
    console.log('\nYou can now test this URL in your browser!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testShareCreation();
