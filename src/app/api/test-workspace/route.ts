import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Test database connectivity and basic workspace functionality
    const tests = {
      database_connected: false,
      hexie_cards_available: 0,
      categories_available: 0,
      gamified_tables_exist: false,
      sample_data_created: false
    };

    // Test basic database connection
    try {
      const hexies = await db.getHexieCards({ 
        subscription_tier: 'free', 
        is_active: true 
      });
      tests.database_connected = true;
      tests.hexie_cards_available = hexies.length;
    } catch (error) {
      console.error('Database connection test failed:', error);
    }

    // Test if categories exist
    try {
      const { data: categories } = await db.supabase
        .from('categories')
        .select('*')
        .limit(10);
      tests.categories_available = categories?.length || 0;
    } catch (error) {
      console.error('Categories test failed:', error);
    }

    // Test if gamified workspace tables exist
    try {
      const { data: workspaceBoards } = await db.supabase
        .from('workspace_boards')
        .select('*')
        .limit(1);
      tests.gamified_tables_exist = true;
    } catch (error) {
      console.error('Gamified tables test failed:', error);
    }

    return NextResponse.json({
      status: 'success',
      tests,
      message: tests.database_connected 
        ? 'Database is accessible' 
        : 'Database connection issues detected'
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: null
    }, { status: 500 });
  }
}