#!/usr/bin/env node

/**
 * Apply database migration using Supabase client
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    console.log('📦 Reading migration file...')
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251110000000_report_data_api_functions.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`🚀 Applying ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`   [${i + 1}/${statements.length}] Executing...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message)
        console.error('Statement:', statement.substring(0, 200) + '...')
      }
    }
    
    console.log('✅ Migration applied successfully!')
    console.log('\n📊 Created functions:')
    console.log('   - get_lvi_timeseries(brand_id, start_date, end_date)')
    console.log('   - get_brand_stats(brand_id, period)')
    console.log('   - get_prompt_performance(brand_id, period)')
    console.log('   - refresh_brand_metrics()')
    console.log('\n🗄️  Created materialized view:')
    console.log('   - brand_metrics_latest')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

applyMigration()
