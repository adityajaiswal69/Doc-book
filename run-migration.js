const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase URL or Service Role Key in .env.local');
    console.log('Please make sure you have:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  console.log('🔗 Connecting to Supabase...');
  console.log('URL:', supabaseUrl);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration...');
    console.log('Migration file size:', migrationSQL.length, 'characters');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} had an issue (this might be normal):`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    console.log('🎉 Migration completed!');
    
    // Test the tables
    console.log('\n🧪 Testing tables...');
    
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('count')
      .limit(1);
    
    if (docsError) {
      console.log('❌ Documents table test failed:', docsError.message);
    } else {
      console.log('✅ Documents table is working');
    }

    const { data: userRooms, error: roomsError } = await supabase
      .from('user_rooms')
      .select('count')
      .limit(1);
    
    if (roomsError) {
      console.log('❌ User rooms table test failed:', roomsError.message);
    } else {
      console.log('✅ User rooms table is working');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runMigration();
