const { createClient } = require('@supabase/supabase-js');

// Create a test public document for sharing
async function createTestPublicDocument() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('📝 Creating a test public document...\n');

    // Create a test document with sharing enabled
    const testDocument = {
      title: 'Test Shared Document',
      content: 'This is a test document that has been made public for sharing.\n\nIt contains some sample content to demonstrate the preview functionality.',
      blocks_content: [
        {
          id: '1',
          type: 'text',
          content: 'Welcome to the Test Shared Document!',
          order: 0
        },
        {
          id: '2',
          type: 'text',
          content: 'This document has been made public and can be shared via preview link.',
          order: 1
        },
        {
          id: '3',
          type: 'text',
          content: 'You can see this content because the document is marked as public (is_public = true).',
          order: 2
        },
        {
          id: '4',
          type: 'text',
          content: 'The preview functionality is working correctly!',
          order: 3
        }
      ],
      type: 'document',
      parent_id: null,
      order_index: 0,
      is_public: true,
      share_children: false,
      preview_token: '17a840bb-0665-4799-9418-2f3a2faf8346' // Use the same token for testing
    };

    console.log('Inserting test document...');
    const { data, error } = await supabase
      .from('documents')
      .insert([testDocument])
      .select();

    if (error) {
      console.error('❌ Error creating test document:', error.message);
      return;
    }

    console.log('✅ Test document created successfully!');
    console.log('Document ID:', data[0].id);
    console.log('Preview Token:', data[0].preview_token);
    console.log('Title:', data[0].title);
    console.log('Is Public:', data[0].is_public);

    console.log('\n🔗 You can now test the preview page with this URL:');
    console.log(`http://localhost:3000/preview/${data[0].preview_token}`);

    // Test the get_shared_documents function with the new document
    console.log('\n🧪 Testing get_shared_documents function...');
    const { data: sharedDocs, error: sharedError } = await supabase
      .rpc('get_shared_documents', { token: data[0].preview_token });

    if (sharedError) {
      console.error('❌ get_shared_documents test failed:', sharedError.message);
    } else {
      console.log('✅ get_shared_documents function works! Found documents:', sharedDocs?.length || 0);
      if (sharedDocs && sharedDocs.length > 0) {
        console.log('Retrieved document:', sharedDocs[0].title);
      }
    }

  } catch (error) {
    console.error('❌ Failed to create test document:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Run the script
createTestPublicDocument();
