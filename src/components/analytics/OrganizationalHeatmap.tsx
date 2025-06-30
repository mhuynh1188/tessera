'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface HeatmapUnit {
  id: string;
  anonymized_unit_id: string;
  toxicity_level: number;
  unit_size: number;
  category_distribution: Record<string, number>;
  trend_data: Array<{week: number, severity: number}>;
  intervention_effectiveness: number;
  geographic_region: string;
  building_type: string;
  district: string;
  height_category: 'low' | 'medium' | 'high' | 'critical';
  last_updated: string;
}

interface OrganizationalHeatmapProps {
  data: HeatmapUnit[];
  width?: number;
  height?: number;
  onUnitClick?: (unit: HeatmapUnit) => void;
}

export const OrganizationalHeatmap: React.FC<OrganizationalHeatmapProps> = ({
  data,
  width = 900,
  height = 600,
  onUnitClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedUnit, setSelectedUnit] = useState<HeatmapUnit | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    // Remove any existing tooltips
    d3.selectAll('.heatmap-tooltip').remove();

    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales for "city" visualization
    const gridCols = Math.ceil(Math.sqrt(data.length * 1.5));
    const gridRows = Math.ceil(data.length / gridCols);
    const cellWidth = innerWidth / gridCols;
    const cellHeight = innerHeight / gridRows;

    // Color scale based on toxicity level (building height metaphor)
    const colorScale = d3.scaleSequential()
      .domain([1, 5])
      .interpolator(d3.interpolateRdYlBu)
      .clamp(true);

    // Height scale for 3D effect
    const heightScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.toxicity_level) as [number, number])
      .range([10, 80]);

    // Size scale for building footprint
    const sizeScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.unit_size) as [number, number])
      .range([0.6, 1.0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .attr('fill', 'currentColor')
      .text('Organizational Health "City" View');

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'heatmap-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)');

    // Create "buildings" (organizational units)
    const buildings = g.selectAll('.building')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'building')
      .attr('transform', (d, i) => {
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        return `translate(${col * cellWidth + cellWidth/2}, ${row * cellHeight + cellHeight/2})`;
      });

    // Create building base (foundation)
    buildings.append('rect')
      .attr('class', 'building-base')
      .attr('x', d => -cellWidth * sizeScale(d.unit_size) / 2)
      .attr('y', d => -cellHeight * sizeScale(d.unit_size) / 2)
      .attr('width', d => cellWidth * sizeScale(d.unit_size))
      .attr('height', d => cellHeight * sizeScale(d.unit_size))
      .attr('fill', '#e5e7eb')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1);

    // Create building height (main structure)
    buildings.append('rect')
      .attr('class', 'building-main')
      .attr('x', d => -cellWidth * sizeScale(d.unit_size) * 0.4)
      .attr('y', d => -cellHeight * sizeScale(d.unit_size) * 0.4 - heightScale(d.toxicity_level))
      .attr('width', d => cellWidth * sizeScale(d.unit_size) * 0.8)
      .attr('height', d => heightScale(d.toxicity_level))
      .attr('fill', d => colorScale(d.toxicity_level))
      .attr('stroke', '#374151')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('opacity', 0.8);

    // Add building type indicators
    buildings.append('text')
      .attr('x', 0)
      .attr('y', 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .attr('fill', 'currentColor')
      .text(d => getBuildingSymbol(d.building_type));

    // Add district labels
    buildings.append('text')
      .attr('x', 0)
      .attr('y', d => cellHeight * sizeScale(d.unit_size) / 2 + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '8px')
      .attr('fill', '#6b7280')
      .text(d => d.district.split(' ')[0]); // Show first word only

    // Add interactivity
    buildings
      .on('mouseover', function(event, d) {
        d3.select(this).select('.building-main')
          .transition()
          .duration(200)
          .style('opacity', 1)
          .attr('stroke-width', 2);

        tooltip.transition().duration(200).style('opacity', .95);
        
        tooltip.html(`
          <div class="font-semibold text-sm mb-2">${d.district} - ${d.building_type.replace('_', ' ')}</div>
          <div class="text-xs space-y-1">
            <div><span class="text-gray-300">Toxicity Level:</span> ${d.toxicity_level.toFixed(1)}/5</div>
            <div><span class="text-gray-300">Unit Size:</span> ${d.unit_size} people</div>
            <div><span class="text-gray-300">Trend:</span> <span class="${getTrendColor(d.trend_data)}">${getTrendDirection(d.trend_data)}</span></div>
            <div><span class="text-gray-300">Intervention Score:</span> ${d.intervention_effectiveness.toFixed(1)}/5</div>
            <div class="mt-2">
              <div class="text-gray-300 text-xs">Top Issues:</div>
              ${Object.entries(d.category_distribution)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 2)
                .map(([cat, pct]) => `<div class="text-xs">${cat}: ${((pct as number) * 100).toFixed(0)}%</div>`)
                .join('')}
            </div>
          </div>
        `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('.building-main')
          .transition()
          .duration(200)
          .style('opacity', 0.8)
          .attr('stroke-width', 1);
        
        tooltip.transition().duration(300).style('opacity', 0);
      })
      .on('click', function(event, d) {
        setSelectedUnit(d);
        onUnitClick?.(d);
      });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, ${height - 140})`);

    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .attr('fill', 'currentColor')
      .text('Toxicity Level');

    const legendScale = d3.scaleLinear()
      .domain([1, 5])
      .range([0, 80]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => d.toString());

    // Color gradient for legend
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'toxicity-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.selectAll('stop')
      .data([
        {offset: '0%', color: colorScale(1)},
        {offset: '25%', color: colorScale(2)},
        {offset: '50%', color: colorScale(3)},
        {offset: '75%', color: colorScale(4)},
        {offset: '100%', color: colorScale(5)}
      ])
      .enter()
      .append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 10)
      .attr('width', 80)
      .attr('height', 15)
      .style('fill', 'url(#toxicity-gradient)')
      .attr('stroke', '#374151')
      .attr('stroke-width', 1);

    legend.append('g')
      .attr('transform', 'translate(0, 40)')
      .call(legendAxis);

    // Cleanup function
    return () => {
      d3.selectAll('.heatmap-tooltip').remove();
    };

  }, [data, width, height]);

  // Helper functions
  const getBuildingSymbol = (type: string): string => {
    const symbols = {
      'office_tower': '🏢',
      'headquarters': '🏛️',
      'industrial': '🏭',
      'residential': '🏠',
      'conference_center': '🏢',
      'mixed_use': '🏘️'
    };
    return symbols[type as keyof typeof symbols] || '🏢';
  };

  const getTrendDirection = (trendData: Array<{week: number, severity: number}>): string => {
    if (!trendData || trendData.length < 2) return 'Stable';
    
    const first = trendData[0].severity;
    const last = trendData[trendData.length - 1].severity;
    const change = last - first;
    
    if (change < -0.2) return 'Improving';
    if (change > 0.2) return 'Declining';
    return 'Stable';
  };

  const getTrendColor = (trendData: Array<{week: number, severity: number}>): string => {
    const direction = getTrendDirection(trendData);
    switch (direction) {
      case 'Improving': return 'text-green-400';
      case 'Declining': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="heatmap-container">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="organizational-heatmap"
      />
      {selectedUnit && (
        <div className="unit-details mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            {selectedUnit.district} - {selectedUnit.building_type.replace('_', ' ')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Toxicity Level:</strong> {selectedUnit.toxicity_level.toFixed(2)}/5</p>
              <p><strong>Unit Size:</strong> {selectedUnit.unit_size} people</p>
              <p><strong>Region:</strong> {selectedUnit.geographic_region}</p>
            </div>
            <div>
              <p><strong>Intervention Score:</strong> {selectedUnit.intervention_effectiveness.toFixed(2)}/5</p>
              <p><strong>Trend:</strong> {getTrendDirection(selectedUnit.trend_data)}</p>
              <p><strong>Last Updated:</strong> {new Date(selectedUnit.last_updated).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Category Distribution</h4>
            <div className="space-y-2">
              {Object.entries(selectedUnit.category_distribution)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([category, percentage]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span>{category}</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded mr-2">
                        <div 
                          className="h-full bg-blue-500 rounded"
                          style={{ width: `${(percentage as number) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{((percentage as number) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {selectedUnit.trend_data.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Trend History</h4>
              <div className="flex items-end space-x-1 h-20">
                {selectedUnit.trend_data.map((point, index) => (
                  <div
                    key={index}
                    className="bg-blue-500 w-4"
                    style={{ height: `${(point.severity / 5) * 100}%` }}
                    title={`Week ${point.week}: ${point.severity.toFixed(1)}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationalHeatmap;