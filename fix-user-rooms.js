const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixUserRooms() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  console.log('🔧 Fixing user_rooms table...');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // First, let's see what we have
    console.log('\n📋 Current user_rooms entries:');
    const { data: currentRooms, error: currentError } = await supabase
      .from('user_rooms')
      .select('*');

    if (currentError) {
      console.log('❌ Error fetching current user_rooms:', currentError.message);
      return;
    }

    currentRooms.forEach(room => {
      console.log(`  - User: ${room.user_id}, Room: ${room.room_id}, Role: ${room.role}`);
    });

    // Update all user_rooms to use the current Supabase user ID
    const currentUserId = '1d11ff22-f6ad-4751-8e66-d8ef5f72d5ae';
    
    console.log(`\n🔄 Updating user_rooms to use current user ID: ${currentUserId}`);
    
    const { data: updatedRooms, error: updateError } = await supabase
      .from('user_rooms')
      .update({ user_id: currentUserId })
      .in('user_id', ['user_31dxMkEMHHsHHJEFJAcMQOpb5Mk', 'jaiszaditya@gmail.com'])
      .select();

    if (updateError) {
      console.log('❌ Error updating user_rooms:', updateError.message);
      return;
    }

    console.log(`✅ Updated ${updatedRooms.length} user_rooms entries`);

    // Show the updated results
    console.log('\n📋 Updated user_rooms entries:');
    const { data: newRooms, error: newError } = await supabase
      .from('user_rooms')
      .select('*');

    if (newError) {
      console.log('❌ Error fetching updated user_rooms:', newError.message);
      return;
    }

    newRooms.forEach(room => {
      console.log(`  - User: ${room.user_id}, Room: ${room.room_id}, Role: ${room.role}`);
    });

    // Verify documents are now accessible
    console.log('\n📄 Documents accessible to current user:');
    const { data: accessibleDocs, error: docsError } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        created_at,
        user_rooms!inner(role)
      `)
      .eq('user_rooms.user_id', currentUserId);

    if (docsError) {
      console.log('❌ Error fetching accessible documents:', docsError.message);
      return;
    }

    console.log(`✅ Found ${accessibleDocs.length} accessible documents:`);
    accessibleDocs.forEach(doc => {
      console.log(`  - ID: ${doc.id}, Title: ${doc.title}, Role: ${doc.user_rooms[0].role}`);
    });

    console.log('\n🎉 User rooms fix completed! Your documents should now be visible in the app.');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixUserRooms();
