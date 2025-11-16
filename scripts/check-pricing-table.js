// Check if pricing_rules table exists in Supabase
// Run: node scripts/check-pricing-table.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
  console.log('🔍 Checking pricing_rules table...\n')

  try {
    // Method 1: Try to query the table
    console.log('1. Attempting to query pricing_rules table...')
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error querying table:', error.message)
      console.error('   Code:', error.code)
      console.error('   Details:', error.details)
      console.error('   Hint:', error.hint)
    } else {
      console.log('✅ Table exists and is accessible!')
      console.log('   Rows found:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('   Sample data:', JSON.stringify(data[0], null, 2))
      }
    }

    // Method 2: Check via information_schema
    console.log('\n2. Checking via information_schema...')
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT table_name, column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND table_name = 'pricing_rules'
          ORDER BY ordinal_position;
        `
      })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }))

    if (!schemaError && schemaData) {
      console.log('✅ Table found in schema:', schemaData)
    } else {
      console.log('⚠️  Could not check via information_schema (this is normal)')
    }

    // Method 3: Try a direct query
    console.log('\n3. Testing direct query...')
    const { data: directData, error: directError } = await supabase
      .from('pricing_rules')
      .select('id, lessonType, pricePerTwoHours')
      .limit(5)

    if (directError) {
      console.error('❌ Direct query failed:', directError.message)
    } else {
      console.log('✅ Direct query successful!')
      console.log('   Found', directData?.length || 0, 'rows')
      if (directData && directData.length > 0) {
        directData.forEach(row => {
          console.log(`   - ${row.lessonType}: ₵${row.pricePerTwoHours}`)
        })
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    if (!error && data !== null) {
      console.log('✅ SUCCESS: Table exists and is accessible!')
      console.log('💡 If you still see errors in the app:')
      console.log('   1. Wait 30-60 seconds for schema cache to refresh')
      console.log('   2. Restart your Next.js dev server')
      console.log('   3. Clear browser cache and refresh')
    } else {
      console.log('❌ ISSUE: Table may not exist or is not accessible')
      console.log('💡 Solutions:')
      console.log('   1. Run the SQL in Supabase SQL Editor again')
      console.log('   2. Check Supabase Dashboard → Table Editor')
      console.log('   3. Verify you\'re connected to the correct project')
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    console.error(err)
  }
}

checkTable()

