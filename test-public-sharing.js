const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPublicSharing() {
  console.log('🧪 Testing public sharing functionality...');
  
  try {
    // Test 1: Check if sharing columns exist
    console.log('\n1️⃣ Testing database schema...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'documents')
      .in('column_name', ['is_shared', 'share_id', 'shared_at', 'share_scope']);
    
    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return;
    }
    
    const expectedColumns = ['is_shared', 'share_id', 'shared_at', 'share_scope'];
    const foundColumns = columns.map(col => col.column_name);
    
    console.log('Found columns:', foundColumns);
    
    if (expectedColumns.every(col => foundColumns.includes(col))) {
      console.log('✅ All sharing columns exist');
    } else {
      console.log('❌ Missing columns:', expectedColumns.filter(col => !foundColumns.includes(col)));
    }
    
    // Test 2: Check if public_shares table exists
    console.log('\n2️⃣ Testing public_shares table...');
    const { data: sharesTable, error: sharesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'public_shares')
      .single();
    
    if (sharesError) {
      console.error('❌ public_shares table not found:', sharesError);
    } else {
      console.log('✅ public_shares table exists');
    }
    
    // Test 3: Check if database functions exist
    console.log('\n3️⃣ Testing database functions...');
    const functions = ['create_public_share', 'revoke_public_share', 'get_shared_document'];
    
    for (const funcName of functions) {
      const { data: func, error: funcError } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_name', funcName)
        .single();
      
      if (funcError) {
        console.log(`❌ Function ${funcName} not found`);
      } else {
        console.log(`✅ Function ${funcName} exists`);
      }
    }
    
    // Test 4: Create a test document and share it
    console.log('\n4️⃣ Testing share creation...');
    
    // Create a test document
    const { data: testDoc, error: createError } = await supabase
      .from('documents')
      .insert({
        title: 'Test Document for Sharing',
        content: 'This is a test document for sharing functionality.',
        type: 'document'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating test document:', createError);
      return;
    }
    
    console.log('✅ Test document created:', testDoc.id);
    
    // Create a test user room (simulating ownership)
    const { error: userRoomError } = await supabase
      .from('user_rooms')
      .insert({
        user_id: 'test-user-id',
        room_id: testDoc.id,
        role: 'owner'
      });
    
    if (userRoomError) {
      console.error('❌ Error creating user room:', userRoomError);
      return;
    }
    
    console.log('✅ User room created');
    
    // Test the create_public_share function
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
    
    // Test 5: Retrieve the shared document
    console.log('\n5️⃣ Testing shared document retrieval...');
    const { data: sharedDoc, error: retrieveError } = await supabase
      .rpc('get_shared_document', {
        p_share_id: shareResult.share_id
      });
    
    if (retrieveError) {
      console.error('❌ Error retrieving shared document:', retrieveError);
      return;
    }
    
    console.log('✅ Shared document retrieved:', {
      documentId: sharedDoc.document.id,
      title: sharedDoc.document.title,
      viewCount: sharedDoc.share.view_count
    });
    
    // Test 6: Revoke the share
    console.log('\n6️⃣ Testing share revocation...');
    const { data: revokeResult, error: revokeError } = await supabase
      .rpc('revoke_public_share', {
        p_document_id: testDoc.id
      });
    
    if (revokeError) {
      console.error('❌ Error revoking share:', revokeError);
      return;
    }
    
    console.log('✅ Share revoked successfully');
    
    // Test 7: Verify share is revoked
    const { data: revokedDoc, error: revokedError } = await supabase
      .rpc('get_shared_document', {
        p_share_id: shareResult.share_id
      });
    
    if (revokedError) {
      console.log('✅ Share properly revoked (expected error):', revokedError.message);
    } else {
      console.log('❌ Share still accessible after revocation');
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('documents').delete().eq('id', testDoc.id);
    console.log('✅ Test document deleted');
    
    console.log('\n🎉 All public sharing tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testPublicSharing();
