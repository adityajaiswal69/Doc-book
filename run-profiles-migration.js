const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runProfilesMigration() {
  try {
    console.log('Running profiles table migration...');
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'sql', 'add-profiles-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error running migration:', error);
      process.exit(1);
    }
    
    console.log('✅ Profiles table migration completed successfully!');
    console.log('');
    console.log('The following has been set up:');
    console.log('- profiles table to store user metadata');
    console.log('- Row Level Security policies');
    console.log('- Automatic trigger to create profiles for new users');
    console.log('');
    console.log('Now user names will be properly stored when users sign up!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Alternative method if rpc doesn't work
async function runProfilesMigrationDirect() {
  try {
    console.log('Running profiles table migration (direct method)...');
    
    const sqlPath = path.join(__dirname, 'sql', 'add-profiles-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.from('_').select('*').limit(0); // This will fail but create connection
        
        // For now, we'll output the SQL for manual execution
        console.log('Statement to execute:', statement.trim() + ';');
      }
    }
    
    console.log('');
    console.log('⚠️  Please execute the SQL statements manually in your Supabase SQL Editor:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the content of sql/add-profiles-table.sql');
    console.log('4. Run the migration');
    
  } catch (error) {
    console.error('Migration preparation failed:', error);
  }
}

// Try direct execution, fallback to manual instructions
runProfilesMigrationDirect();
