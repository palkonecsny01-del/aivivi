#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://unpzjplcyxgsvjcvoapo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucHpqcGxjeXhnc3ZqY3ZvYXBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkwNTU5OSwiZXhwIjoyMDk0NDgxNTk5fQ.jPbf8_qS-E7j2Bxg-iqCIX8h7bJ2NrjH94mD8lnWFeE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeDatabase() {
  try {
    console.log('🚀 Supabase database initialization...\n');

    // Read the migration SQL
    const migrationSQL = fs.readFileSync('./supabase/migrations/20260516091457_create_planlabstudio_schema.sql', 'utf-8');

    // Split by statements (simple approach)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('/*') && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('sql', { query: statement });
      if (error) {
        console.error(`❌ Error executing: ${statement.substring(0, 50)}...`);
        console.error(error);
      } else {
        console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
      }
    }

    console.log('\n✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
}

initializeDatabase();
