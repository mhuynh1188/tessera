import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const organizationId = searchParams.get('orgId');
    const aggregationLevel = searchParams.get('level') || 'department'; // department, division, org

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organizational heatmap data with privacy preservation
    const { data: heatmapData, error } = await supabase.rpc('get_organizational_heatmap', {
      org_id: organizationId,
      aggregation_level: aggregationLevel,
      min_group_size: 8 // Higher threshold for heatmap to prevent identification
    });

    if (error) {
      console.error('Heatmap error:', error);
      return NextResponse.json({ error: 'Failed to fetch heatmap data' }, { status: 500 });
    }

    // Transform data for "city" visualization
    const transformedHeatmap = heatmapData?.map((unit: any, index: number) => ({
      id: `unit_${index}`, // Anonymized unit identifier
      anonymized_unit_id: `building_${unit.unit_hash}`, // Hash-based anonymization
      toxicity_level: parseFloat(unit.avg_severity), // Building height
      unit_size: parseInt(unit.group_size), // Building footprint
      category_distribution: unit.category_breakdown || {},
      trend_data: unit.trend_history || [],
      intervention_effectiveness: unit.intervention_score || 0,
      geographic_region: unit.region || 'unknown', // If available
      last_updated: unit.last_updated,
      // Additional "city" metadata
      building_type: categorizeBuildingType(unit.primary_category),
      district: anonymizeDistrict(unit.division_name),
      height_category: categorizeToxicity(parseFloat(unit.avg_severity))
    })) || [];

    return NextResponse.json({
      heatmap: transformedHeatmap,
      metadata: {
        total_units: transformedHeatmap.length,
        aggregation_level: aggregationLevel,
        privacy_level: 'k-anonymous-enhanced',
        min_group_size: 8,
        city_metaphor: true
      }
    });

  } catch (error) {
    console.error('Organizational heatmap API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function categorizeBuildingType(primaryCategory: string): string {
  const buildingTypes = {
    'Communication': 'office_tower',
    'Leadership': 'headquarters',
    'Process': 'industrial',
    'Culture': 'residential',
    'Meetings': 'conference_center',
    'default': 'mixed_use'
  };
  return buildingTypes[primaryCategory as keyof typeof buildingTypes] || buildingTypes.default;
}

function anonymizeDistrict(divisionName: string): string {
  // Create anonymous district names based on hash
  const districts = ['North District', 'South District', 'East District', 'West District', 'Central District'];
  const hash = divisionName ? divisionName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0) : 0;
  return districts[Math.abs(hash) % districts.length];
}

function categorizeToxicity(severity: number): 'low' | 'medium' | 'high' | 'critical' {
  if (severity <= 2) return 'low';
  if (severity <= 3) return 'medium';
  if (severity <= 4) return 'high';
  return 'critical';
}