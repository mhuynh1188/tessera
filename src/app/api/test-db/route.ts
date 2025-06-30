import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export async function GET() {
  try {
    // Test the database connection by fetching hexie cards
    const hexies = await db.getHexieCards({
      subscription_tier: 'free',
      is_active: true
    });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      hexieCount: hexies?.length || 0,
      hexies: hexies?.slice(0, 3) || [] // Show first 3 for testing
    });
  } catch (error: any) {
    console.error('Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message || 'Unknown error',
      details: error
    }, { status: 500 });
  }
}