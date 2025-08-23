const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  console.log('🔗 Testing database connection...');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Test 1: Check if tables exist
    console.log('\n📋 Checking tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['documents', 'user_rooms']);

    if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message);
    } else {
      console.log('✅ Tables found:', tables.map(t => t.table_name));
    }

    // Test 2: Check documents table
    console.log('\n📄 Checking documents table...');
    
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .limit(5);

    if (docsError) {
      console.log('❌ Error fetching documents:', docsError.message);
    } else {
      console.log(`✅ Found ${documents.length} documents:`);
      documents.forEach(doc => {
        console.log(`  - ID: ${doc.id}, Title: ${doc.title}, Created: ${doc.created_at}`);
      });
    }

    // Test 3: Check user_rooms table
    console.log('\n🏠 Checking user_rooms table...');
    
    const { data: userRooms, error: roomsError } = await supabase
      .from('user_rooms')
      .select('*')
      .limit(5);

    if (roomsError) {
      console.log('❌ Error fetching user_rooms:', roomsError.message);
    } else {
      console.log(`✅ Found ${userRooms.length} user_rooms:`);
      userRooms.forEach(room => {
        console.log(`  - User: ${room.user_id}, Room: ${room.room_id}, Role: ${room.role}`);
      });
    }

    // Test 4: Check RLS policies
    console.log('\n🔒 Checking RLS policies...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies');

    if (policiesError) {
      console.log('❌ Error checking policies (this is normal):', policiesError.message);
      console.log('   Policies will be created when you run the migration');
    } else {
      console.log('✅ Policies found:', policies);
    }

    // Test 5: Try to create a test document
    console.log('\n🧪 Testing document creation...');
    
    const testDoc = {
      title: 'Test Document',
      content: 'This is a test document'
    };

    const { data: newDoc, error: createError } = await supabase
      .from('documents')
      .insert(testDoc)
      .select()
      .single();

    if (createError) {
      console.log('❌ Error creating test document:', createError.message);
    } else {
      console.log('✅ Test document created:', newDoc.id);
      
      // Clean up test document
      await supabase.from('documents').delete().eq('id', newDoc.id);
      console.log('🧹 Test document cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDatabase();
