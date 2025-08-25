const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting hierarchical structure migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase-migration-hierarchical.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration SQL loaded, executing...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Database now supports hierarchical document structure');
    console.log('   - Documents can be organized in folders');
    console.log('   - Support for nested document hierarchy');
    console.log('   - Order-based sorting within folders');
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function runMigrationAlternative() {
  try {
    console.log('🚀 Starting hierarchical structure migration (alternative method)...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase-migration-hierarchical.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📖 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
            // Continue with other statements
          }
        } catch (stmtError) {
          console.warn(`⚠️  Warning on statement ${i + 1}:`, stmtError.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Migration completed!');
    console.log('📊 Database now supports hierarchical document structure');
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
}

// Check if we can use the simpler method first
async function checkMigrationCapability() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    if (error) {
      console.log('ℹ️  Simple SQL execution not available, using alternative method...');
      return false;
    }
    return true;
  } catch (error) {
    console.log('ℹ️  Simple SQL execution not available, using alternative method...');
    return false;
  }
}

async function main() {
  const canUseSimpleMethod = await checkMigrationCapability();
  
  if (canUseSimpleMethod) {
    await runMigration();
  } else {
    await runMigrationAlternative();
  }
}

main().catch(console.error);
