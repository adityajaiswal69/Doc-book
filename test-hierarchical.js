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

async function testHierarchicalStructure() {
  try {
    console.log('🧪 Testing hierarchical document structure...');
    
    // Test 1: Check if new columns exist
    console.log('\n1. Checking database schema...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'documents')
      .in('column_name', ['type', 'parent_id', 'order_index']);
    
    if (columnsError) {
      console.error('❌ Error checking schema:', columnsError);
      return;
    }
    
    console.log('✅ Schema check completed');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Test 2: Check if documents have the new fields
    console.log('\n2. Checking existing documents...');
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title, type, parent_id, order_index, created_at')
      .limit(5);
    
    if (docsError) {
      console.error('❌ Error fetching documents:', docsError);
      return;
    }
    
    console.log(`✅ Found ${documents.length} documents`);
    documents.forEach(doc => {
      console.log(`   - ${doc.title}: type=${doc.type}, parent=${doc.parent_id || 'root'}, order=${doc.order_index}`);
    });
    
    // Test 3: Check indexes
    console.log('\n3. Checking database indexes...');
    const { data: indexes, error: indexError } = await supabase
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('tablename', 'documents')
      .like('indexname', 'idx_documents_%');
    
    if (indexError) {
      console.warn('⚠️  Could not check indexes (this is normal for some setups)');
    } else {
      console.log('✅ Indexes found:');
      indexes.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    }
    
    console.log('\n🎉 Hierarchical structure test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start your Next.js application');
    console.log('2. Navigate to the sidebar');
    console.log('3. Try creating folders and documents');
    console.log('4. Test the expand/collapse functionality');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testHierarchicalStructure().catch(console.error);
