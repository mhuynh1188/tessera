import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo purposes
// In production, use a proper database like Supabase
let annotations: Record<string, any[]> = {};
let ratings: Record<string, any[]> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hexieId = searchParams.get('hexieId');
  
  if (hexieId) {
    return NextResponse.json({
      annotations: annotations[hexieId] || [],
      ratings: ratings[hexieId] || []
    });
  }
  
  return NextResponse.json({ annotations, ratings });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, hexieId, data } = body;
    
    if (type === 'annotation') {
      if (!annotations[hexieId]) {
        annotations[hexieId] = [];
      }
      
      // Check if editing existing annotation
      const existingIndex = annotations[hexieId].findIndex(
        ann => ann.id === data.id
      );
      
      if (existingIndex >= 0) {
        // Update existing annotation
        annotations[hexieId][existingIndex] = data;
      } else {
        // Add new annotation
        annotations[hexieId].push(data);
      }
    } else if (type === 'rating') {
      if (!ratings[hexieId]) {
        ratings[hexieId] = [];
      }
      
      // Remove existing rating from this user
      ratings[hexieId] = ratings[hexieId].filter(
        rating => rating.userId !== data.userId
      );
      
      // Add new rating
      ratings[hexieId].push(data);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const hexieId = searchParams.get('hexieId');
    const id = searchParams.get('id');
    
    if (type === 'annotation' && hexieId && id) {
      if (annotations[hexieId]) {
        annotations[hexieId] = annotations[hexieId].filter(
          ann => ann.id !== id
        );
      }
    } else if (type === 'rating' && hexieId && id) {
      if (ratings[hexieId]) {
        ratings[hexieId] = ratings[hexieId].filter(
          rating => rating.id !== id
        );
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}