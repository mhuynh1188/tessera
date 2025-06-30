'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BehaviorPattern } from '@/lib/analytics-aggregation';

interface TimelineDataPoint {
  date: Date;
  severity: number;
  frequency: number;
  category: string;
  pattern_type: string;
}

interface TimelineVisualizationProps {
  data: BehaviorPattern[];
  width?: number;
  height?: number;
  timeRange?: 'week' | 'month' | 'quarter';
  autoPlay?: boolean;
}

export const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  data,
  width = 800,
  height = 400,
  timeRange = 'month',
  autoPlay = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);

  // Generate timeline data from behavior patterns
  useEffect(() => {
    if (!data.length) return;

    const now = new Date();
    const timePoints = [];
    const daysBack = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      data.forEach(pattern => {
        // Generate synthetic timeline data based on pattern trends
        const baseFrequency = pattern.frequency / daysBack;
        const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
        const frequency = Math.max(0, baseFrequency * (1 + variation));
        
        const baseSeverity = pattern.severity_avg;
        const severityTrend = pattern.trend_direction === 'improving' ? -0.01 : 
                             pattern.trend_direction === 'declining' ? 0.01 : 0;
        const severity = Math.max(1, Math.min(5, baseSeverity + (daysBack - i) * severityTrend + (Math.random() - 0.5) * 0.2));
        
        timePoints.push({
          date,
          severity,
          frequency,
          category: pattern.category,
          pattern_type: pattern.pattern_type
        });
      });
    }
    
    setTimelineData(timePoints);
  }, [data, timeRange]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || timelineData.length === 0) return;

    const uniqueDates = [...new Set(timelineData.map(d => d.date.getTime()))].sort();
    const interval = setInterval(() => {
      setCurrentTimeIndex(prev => (prev + 1) % uniqueDates.length);
    }, 500); // Change frame every 500ms

    return () => clearInterval(interval);
  }, [isPlaying, timelineData]);

  useEffect(() => {
    if (!svgRef.current || !timelineData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    // Remove any existing tooltips
    d3.selectAll('.timeline-tooltip').remove();

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get unique dates and current data slice
    const uniqueDates = [...new Set(timelineData.map(d => d.date.getTime()))].sort();
    const currentDate = new Date(uniqueDates[currentTimeIndex] || uniqueDates[0]);
    const currentData = timelineData.filter(d => d.date.getTime() === currentDate.getTime());

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(currentData, d => d.frequency) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([1, 5])
      .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain([...new Set(currentData.map(d => d.category))]);

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(currentData, d => d.frequency) || 1])
      .range([5, 30]);

    // Add title with current date
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .attr('fill', 'currentColor')
      .text(`Behavior Patterns Timeline - ${currentDate.toLocaleDateString()}`);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .text('Frequency');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .text('Severity Level');

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'timeline-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    // Add bubbles with animation
    const bubbles = g.selectAll('.timeline-bubble')
      .data(currentData)
      .enter()
      .append('circle')
      .attr('class', 'timeline-bubble')
      .attr('cx', d => xScale(d.frequency))
      .attr('cy', d => yScale(d.severity))
      .attr('r', 0)
      .attr('fill', d => colorScale(d.category))
      .attr('opacity', 0.7)
      .style('cursor', 'pointer');

    // Animate bubbles
    bubbles.transition()
      .duration(300)
      .attr('r', d => sizeScale(d.frequency));

    // Add interactivity
    bubbles
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('r', sizeScale(d.frequency) * 1.2);

        tooltip.transition().duration(200).style('opacity', .95);
        tooltip.html(`
          <div class="font-semibold text-sm mb-2">${d.pattern_type}</div>
          <div class="text-xs space-y-1">
            <div><span class="text-gray-300">Date:</span> ${d.date.toLocaleDateString()}</div>
            <div><span class="text-gray-300">Category:</span> ${d.category}</div>
            <div><span class="text-gray-300">Severity:</span> ${d.severity.toFixed(1)}/5</div>
            <div><span class="text-gray-300">Frequency:</span> ${d.frequency.toFixed(1)}</div>
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
          .attr('r', sizeScale(d.frequency));
        
        tooltip.transition().duration(300).style('opacity', 0);
      });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, 60)`);

    const categories = [...new Set(currentData.map(d => d.category))];
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

    // Add progress indicator
    const progressBar = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${height - 30})`);

    progressBar.append('rect')
      .attr('width', innerWidth)
      .attr('height', 4)
      .attr('fill', '#e5e7eb')
      .attr('rx', 2);

    progressBar.append('rect')
      .attr('width', (currentTimeIndex / (uniqueDates.length - 1)) * innerWidth)
      .attr('height', 4)
      .attr('fill', '#3b82f6')
      .attr('rx', 2);

    // Cleanup function
    return () => {
      d3.selectAll('.timeline-tooltip').remove();
    };

  }, [timelineData, currentTimeIndex, width, height]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetTimeline = () => {
    setCurrentTimeIndex(0);
    setIsPlaying(false);
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available for timeline visualization
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlayPause}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button
            onClick={resetTimeline}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            🔄 Reset
          </button>
        </div>
        <div className="text-sm text-gray-600">
          Frame {currentTimeIndex + 1} of {[...new Set(timelineData.map(d => d.date.getTime()))].length}
        </div>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="timeline-visualization border border-gray-200 rounded"
      />

      <div className="mt-4 text-xs text-gray-500">
        <p>• Each bubble represents a behavior pattern occurrence on that date</p>
        <p>• X-axis: Frequency of occurrence, Y-axis: Severity level (1-5)</p>
        <p>• Bubble size indicates relative frequency, color indicates category</p>
      </div>
    </div>
  );
};

export default TimelineVisualization;