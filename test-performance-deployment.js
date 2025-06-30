const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testPerformanceOptimization() {
  console.log('🔍 Testing Supabase Performance Optimization Deployment...\n')

  try {
    // Test 1: Check if optimization functions exist
    console.log('1️⃣ Testing performance monitoring functions...')
    
    try {
      const { data: performanceStats, error: perfError } = await supabase.rpc('get_table_performance_stats')
      if (perfError) {
        console.log('❌ Performance functions not yet deployed')
        console.log('   → Deploy comprehensive-supabase-performance-fix.sql first')
      } else {
        console.log('✅ Performance monitoring functions are working!')
        console.log(`   → Found ${performanceStats?.length || 0} tables being monitored`)
      }
    } catch (err) {
      console.log('❌ Performance functions not available yet')
    }

    // Test 2: Check RLS policy optimization
    console.log('\n2️⃣ Checking RLS policy optimization...')
    
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, qual')
      .eq('schemaname', 'public')
      .limit(10)

    if (policyError) {
      console.log('❌ Cannot access policy information:', policyError.message)
    } else {
      const unoptimizedPolicies = policies?.filter(p => 
        p.qual?.includes('auth.uid()') && !p.qual?.includes('(select auth.uid())')
      ).length || 0
      
      const optimizedPolicies = policies?.filter(p => 
        p.qual?.includes('(select auth.uid())')
      ).length || 0

      console.log(`✅ Policy analysis complete:`)
      console.log(`   → ${optimizedPolicies} policies optimized`)
      console.log(`   → ${unoptimizedPolicies} policies need optimization`)
      
      if (unoptimizedPolicies === 0) {
        console.log('🎉 All policies are optimized!')
      }
    }

    // Test 3: Check basic table access
    console.log('\n3️⃣ Testing basic table access performance...')
    
    const startTime = Date.now()
    const { data: hexieCards, error: hexieError } = await supabase
      .from('hexie_cards')
      .select('id, title, created_at, is_active')
      .eq('is_active', true)
      .limit(50)

    const queryTime = Date.now() - startTime

    if (hexieError) {
      console.log('❌ Table access error:', hexieError.message)
    } else {
      console.log(`✅ Retrieved ${hexieCards?.length || 0} hexie cards in ${queryTime}ms`)
      if (queryTime < 500) {
        console.log('🚀 Excellent query performance!')
      } else if (queryTime < 1000) {
        console.log('👍 Good query performance')
      } else {
        console.log('⚠️ Query performance could be improved')
      }
    }

    // Test 4: Check for index usage (basic test)
    console.log('\n4️⃣ Testing workspace collaboration performance...')
    
    const startTime2 = Date.now()
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select(`
        id, 
        name, 
        owner_id,
        workspace_collaborators!inner(user_id, role, accepted_at)
      `)
      .not('workspace_collaborators.accepted_at', 'is', null)
      .limit(20)

    const queryTime2 = Date.now() - startTime2

    if (workspaceError) {
      console.log('❌ Workspace query error:', workspaceError.message)
    } else {
      console.log(`✅ Retrieved ${workspaces?.length || 0} collaborative workspaces in ${queryTime2}ms`)
      if (queryTime2 < 800) {
        console.log('🚀 Excellent collaboration query performance!')
      } else if (queryTime2 < 1500) {
        console.log('👍 Good collaboration performance')
      } else {
        console.log('⚠️ Collaboration queries need optimization')
      }
    }

    // Summary
    console.log('\n📊 PERFORMANCE OPTIMIZATION STATUS:')
    if (unoptimizedPolicies === 0 && queryTime < 500 && queryTime2 < 800) {
      console.log('🎉 EXCELLENT - Performance optimization is fully deployed and working!')
    } else if (optimizedPolicies > 0 || queryTime < 1000) {
      console.log('✅ GOOD - Performance optimization is partially deployed')
      console.log('   → Consider deploying the full optimization script')
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT - Deploy performance optimization script')
      console.log('   → Use comprehensive-supabase-performance-fix.sql')
    }

  } catch (error) {
    console.error('❌ Testing failed:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Check .env.local has correct SUPABASE credentials')
    console.log('   2. Ensure database is accessible')
    console.log('   3. Verify service role key has proper permissions')
  }
}

// Run the test
testPerformanceOptimization()
  .then(() => {
    console.log('\n✅ Performance testing completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })