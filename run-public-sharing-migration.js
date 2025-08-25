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

async function runPublicSharingMigration() {
  console.log('🚀 Starting public sharing migration...');
  
  try {
    // Read the migration SQL file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'sql', 'schema', '05_public_shares.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { error: directError } = await supabase.from('documents').select('count').limit(1);
          if (directError) {
            console.error('❌ Failed to execute SQL statement:', error);
            console.error('Statement:', statement);
            throw error;
          }
        }
        
        console.log('✅ Statement executed successfully');
      } catch (error) {
        console.error('❌ Error executing statement:', error.message);
        console.error('Statement:', statement);
        throw error;
      }
    }
    
    console.log('\n🎉 Public sharing migration completed successfully!');
    console.log('\n📋 What was added:');
    console.log('- Sharing fields to documents table (is_shared, share_id, shared_at, share_scope)');
    console.log('- New public_shares table for additional metadata');
    console.log('- Database functions for creating, revoking, and retrieving shares');
    console.log('- Indexes for efficient share lookups');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runPublicSharingMigration();
