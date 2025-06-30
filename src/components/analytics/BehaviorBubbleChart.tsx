'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BehaviorPattern } from '@/lib/analytics-aggregation';

interface TooltipData {
  pattern_type: string;
  category: string;
  severity_avg: number;
  frequency: number;
  trend_direction: string;
}

interface BehaviorBubbleChartProps {
  data: BehaviorPattern[];
  stakeholderRole: 'hr' | 'executive' | 'middle_management';
  width?: number;
  height?: number;
  onPatternClick?: (pattern: BehaviorPattern) => void;
}

export const BehaviorBubbleChart: React.FC<BehaviorBubbleChartProps> = ({
  data,
  stakeholderRole,
  width = 800,
  height = 600,
  onPatternClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPattern, setSelectedPattern] = useState<BehaviorPattern | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render
    
    // Remove any existing tooltips
    d3.selectAll('.behavior-tooltip').remove();

    // Responsive dimensions
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.frequency) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.severity_avg) as [number, number])
      .range([innerHeight, 0]);

    const sizeScale = d3.scaleSqrt()
      .domain(d3.extent(data, d => d.size_indicator) as [number, number])
      .range([10, 60]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain([...new Set(data.map(d => d.category))]);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 35)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .text('Frequency of Pattern');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -30)
      .attr('x', -innerHeight / 2)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .text('Severity Level');

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'behavior-tooltip')
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

    // Add bubbles with animation
    const bubbles = g.selectAll('.bubble')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'bubble')
      .attr('cx', d => xScale(d.frequency))
      .attr('cy', d => yScale(d.severity_avg))
      .attr('r', 0) // Start with radius 0 for animation
      .attr('fill', d => colorScale(d.category))
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('r', sizeScale(d.size_indicator) * 1.1);
        
        tooltip.transition().duration(200).style('opacity', .95);
        
        const roleSpecificData = getRoleSpecificTooltip(d, stakeholderRole);
        
        tooltip.html(`
          <div class="font-semibold text-sm mb-2">${d.pattern_type}</div>
          <div class="text-xs space-y-1">
            <div><span class="text-gray-300">Category:</span> ${d.category}</div>
            <div><span class="text-gray-300">Severity:</span> ${d.severity_avg.toFixed(1)}/5</div>
            <div><span class="text-gray-300">Frequency:</span> ${d.frequency}</div>
            <div><span class="text-gray-300">Trend:</span> <span class="${
              d.trend_direction === 'improving' ? 'text-green-400' :
              d.trend_direction === 'declining' ? 'text-red-400' : 'text-yellow-400'
            }">${d.trend_direction}</span></div>
            ${roleSpecificData}
          </div>
        `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.7)
          .attr('r', sizeScale(d.size_indicator));
        tooltip.transition().duration(300).style('opacity', 0);
      })
      .on('click', function(event, d) {
        setSelectedPattern(d);
        onPatternClick?.(d);
      });

    // Animate bubbles
    bubbles.transition()
      .duration(1000)
      .attr('r', d => sizeScale(d.size_indicator));

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, 20)`);

    const categories = [...new Set(data.map(d => d.category))];
    categories.forEach((category, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('circle')
        .attr('r', 8)
        .attr('fill', colorScale(category));

      legendRow.append('text')
        .attr('x', 15)
        .attr('y', 5)
        .style('font-size', '12px')
        .attr('fill', 'currentColor')
        .text(category);
    });

    // Cleanup function
    return () => {
      d3.selectAll('.behavior-tooltip').remove();
    };

  }, [data, width, height, stakeholderRole]);

  // Role-specific tooltip content
  const getRoleSpecificTooltip = (pattern: BehaviorPattern, role: string): string => {
    switch (role) {
      case 'hr':
        return `<div><span class="text-gray-300">Intervention Priority:</span> ${
          pattern.severity_avg >= 4 ? 'High' : pattern.severity_avg >= 3 ? 'Medium' : 'Low'
        }</div>`;
      case 'executive':
        return `<div><span class="text-gray-300">Business Impact:</span> ${
          pattern.size_indicator >= 8 ? 'Critical' : pattern.size_indicator >= 5 ? 'Significant' : 'Moderate'
        }</div>`;
      case 'middle_management':
        return `<div><span class="text-gray-300">Team Support:</span> ${
          pattern.trend_direction === 'declining' ? 'Immediate Action' : 'Monitor & Guide'
        }</div>`;
      default:
        return '';
    }
  };

  return (
    <div className="bubble-chart-container">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="behavior-bubble-chart"
      />
      {selectedPattern && (
        <div className="pattern-details mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{selectedPattern.pattern_type}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Category:</strong> {selectedPattern.category}</p>
              <p><strong>Severity:</strong> {selectedPattern.severity_avg.toFixed(2)}/5</p>
              <p><strong>Frequency:</strong> {selectedPattern.frequency}</p>
            </div>
            <div>
              <p><strong>Trend:</strong> {selectedPattern.trend_direction}</p>
              <p><strong>Framework:</strong> {selectedPattern.psychological_framework}</p>
              <p><strong>Last Updated:</strong> {new Date(selectedPattern.last_updated).toLocaleDateString()}</p>
            </div>
          </div>
          {selectedPattern.environmental_factors.length > 0 && (
            <div className="mt-3">
              <p><strong>Environmental Factors:</strong></p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedPattern.environmental_factors.map((factor, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BehaviorBubbleChart;