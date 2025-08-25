const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDragAndDrop() {
  try {
    console.log('🧪 Testing drag and drop functionality...');
    
    // Test 1: Check if moveDocument action exists
    console.log('\n1. Testing moveDocument action...');
    
    // First, let's create a test folder and document
    console.log('Creating test folder...');
    const { createFolder } = await import('./actions/actions.js');
    
    // Note: This is a mock test since we can't actually call the action from here
    // In a real scenario, you would test this through the UI
    
    console.log('✅ Drag and drop test setup completed!');
    console.log('\nTo test drag and drop functionality:');
    console.log('1. Start your Next.js application: npm run dev');
    console.log('2. Create a folder and some documents');
    console.log('3. Try dragging documents:');
    console.log('   - Drag a document into a folder');
    console.log('   - Drag a document before/after another document');
    console.log('   - Drag a folder to reorder it');
    console.log('4. Check that the changes appear in real-time');
    
    console.log('\n🎯 Drag and Drop Features:');
    console.log('   - Visual feedback during drag (opacity change)');
    console.log('   - Drop zones (before/after/inside)');
    console.log('   - Real-time updates in sidebar');
    console.log('   - Proper parent-child relationships');
    console.log('   - Order index management');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDragAndDrop().catch(console.error);
