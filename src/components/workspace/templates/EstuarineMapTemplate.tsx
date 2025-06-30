import React from 'react';

interface EstuarineMapTemplateProps {
  width?: number;
  height?: number;
  className?: string;
}

export const EstuarineMapTemplate: React.FC<EstuarineMapTemplateProps> = ({ 
  width = 1200, 
  height = 800, 
  className = "" 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradients for zones */}
        <radialGradient id="volatileGradient" cx="0.2" cy="0.8" r="0.4">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05"/>
        </radialGradient>
        
        <radialGradient id="workingGradient" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03"/>
        </radialGradient>
        
        <radialGradient id="liminalGradient" cx="0.7" cy="0.3" r="0.3">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05"/>
        </radialGradient>
        
        <radialGradient id="counterfactualGradient" cx="0.8" cy="0.2" r="0.3">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.08"/>
        </radialGradient>

        {/* Grid pattern */}
        <pattern id="gridPattern" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#6b7280" strokeWidth="0.5" opacity="0.3"/>
        </pattern>

        {/* Logarithmic grid for time axis */}
        <pattern id="logGridPattern" width="100" height="50" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 50" fill="none" stroke="#6b7280" strokeWidth="0.3" opacity="0.2"/>
        </pattern>
      </defs>

      {/* Background */}
      <rect width={width} height={height} fill="#f8fafc" stroke="none"/>
      
      {/* Grid overlay */}
      <rect width={width} height={height} fill="url(#gridPattern)" opacity="0.3"/>

      {/* Main coordinate system */}
      <g transform="translate(80, 60)">
        {/* Define working area dimensions */}
        <g id="workingArea">
          {/* Zone backgrounds */}
          
          {/* Volatile Zone (bottom-left) */}
          <ellipse 
            cx="150" 
            cy="600" 
            rx="180" 
            ry="120" 
            fill="url(#volatileGradient)"
            stroke="#10b981" 
            strokeWidth="2" 
            strokeDasharray="5,5"
            opacity="0.6"
          />
          
          {/* Working Area (center) */}
          <rect 
            x="100" 
            y="200" 
            width="800" 
            height="400" 
            fill="url(#workingGradient)"
            stroke="none"
            opacity="0.4"
          />
          
          {/* Liminal Zone */}
          <ellipse 
            cx="750" 
            cy="250" 
            rx="200" 
            ry="150" 
            fill="url(#liminalGradient)"
            stroke="#f59e0b" 
            strokeWidth="2" 
            strokeDasharray="8,3"
            opacity="0.5"
          />
          
          {/* Counter-factual Zone (top-right) */}
          <path 
            d="M 600 100 Q 850 120 1000 180 Q 1020 280 950 400 Q 800 350 700 300 Q 650 200 600 100 Z"
            fill="url(#counterfactualGradient)"
            stroke="#ef4444" 
            strokeWidth="3"
            opacity="0.6"
          />

          {/* Axes */}
          {/* X-axis (Time to change) */}
          <line x1="50" y1="650" x2="1000" y2="650" stroke="#374151" strokeWidth="2"/>
          <polygon points="1000,650 990,645 990,655" fill="#374151"/>
          
          {/* Y-axis (Energy cost) */}
          <line x1="50" y1="650" x2="50" y2="80" stroke="#374151" strokeWidth="2"/>
          <polygon points="50,80 45,90 55,90" fill="#374151"/>

          {/* Logarithmic time scale markers */}
          <g id="timeMarkers" stroke="#6b7280" strokeWidth="1">
            <line x1="150" y1="645" x2="150" y2="655"/>
            <text x="150" y="670" textAnchor="middle" fontSize="12" fill="#6b7280">Hours</text>
            
            <line x1="300" y1="645" x2="300" y2="655"/>
            <text x="300" y="670" textAnchor="middle" fontSize="12" fill="#6b7280">Days</text>
            
            <line x1="550" y1="645" x2="550" y2="655"/>
            <text x="550" y="670" textAnchor="middle" fontSize="12" fill="#6b7280">Months</text>
            
            <line x1="850" y1="645" x2="850" y2="655"/>
            <text x="850" y="670" textAnchor="middle" fontSize="12" fill="#6b7280">Years</text>
          </g>

          {/* Energy scale markers */}
          <g id="energyMarkers" stroke="#6b7280" strokeWidth="1">
            <line x1="45" y1="550" x2="55" y2="550"/>
            <text x="35" y="555" textAnchor="end" fontSize="12" fill="#6b7280">Low</text>
            
            <line x1="45" y1="400" x2="55" y2="400"/>
            <text x="35" y="405" textAnchor="end" fontSize="12" fill="#6b7280">Med</text>
            
            <line x1="45" y1="250" x2="55" y2="250"/>
            <text x="35" y="255" textAnchor="end" fontSize="12" fill="#6b7280">High</text>
            
            <line x1="45" y1="150" x2="55" y2="150"/>
            <text x="35" y="155" textAnchor="end" fontSize="12" fill="#6b7280">Extreme</text>
          </g>

          {/* Zone labels */}
          <g id="zoneLabels">
            <text x="150" y="520" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#059669">
              VOLATILE ZONE
            </text>
            <text x="150" y="540" textAnchor="middle" fontSize="10" fill="#059669">
              (Low Energy/Time)
            </text>
            
            <text x="500" y="120" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2563eb">
              WORKING AREA
            </text>
            
            <text x="750" y="180" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#d97706">
              LIMINAL
            </text>
            <text x="750" y="200" textAnchor="middle" fontSize="10" fill="#d97706">
              (External Change)
            </text>
            
            <text x="800" y="250" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#dc2626">
              COUNTER-FACTUAL
            </text>
            <text x="800" y="270" textAnchor="middle" fontSize="10" fill="#dc2626">
              (Unlikely to Change)
            </text>
          </g>

          {/* Boundary lines with labels */}
          <g id="boundaryLines">
            {/* Counter-factual border (red line) */}
            <path 
              d="M 600 100 Q 850 120 1000 180 Q 1020 280 950 400"
              fill="none"
              stroke="#dc2626" 
              strokeWidth="3"
              strokeDasharray="10,5"
            />
            <text x="920" y="320" fontSize="11" fill="#dc2626" fontWeight="bold">
              Counter-factual Border
            </text>
            
            {/* Liminal line */}
            <ellipse 
              cx="750" 
              cy="250" 
              rx="200" 
              ry="150" 
              fill="none"
              stroke="#d97706" 
              strokeWidth="2" 
              strokeDasharray="8,3"
            />
            
            {/* Volatile zone border */}
            <ellipse 
              cx="150" 
              cy="600" 
              rx="180" 
              ry="120" 
              fill="none"
              stroke="#059669" 
              strokeWidth="2" 
              strokeDasharray="5,5"
            />
          </g>

          {/* Sample constraint markers */}
          <g id="constraintMarkers">
            {/* Rigid constraints (squares) */}
            <rect x="200" y="300" width="12" height="12" fill="#ef4444" stroke="#dc2626" strokeWidth="1"/>
            <rect x="400" y="450" width="12" height="12" fill="#ef4444" stroke="#dc2626" strokeWidth="1"/>
            
            {/* Elastic constraints (diamonds) */}
            <polygon points="350,350 360,340 370,350 360,360" fill="#f59e0b" stroke="#d97706" strokeWidth="1"/>
            <polygon points="600,500 610,490 620,500 610,510" fill="#f59e0b" stroke="#d97706" strokeWidth="1"/>
            
            {/* Permeable constraints (circles) */}
            <circle cx="300" cy="200" r="6" fill="#10b981" stroke="#059669" strokeWidth="1"/>
            <circle cx="500" cy="350" r="6" fill="#10b981" stroke="#059669" strokeWidth="1"/>
            
            {/* Phase shift constraints (hexagons) */}
            <polygon points="450,280 460,275 470,280 470,290 460,295 450,290" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="1"/>
          </g>

          {/* Constructor indicators */}
          <g id="constructorMarkers">
            {/* Process constructors */}
            <polygon points="250,400 265,395 280,400 275,415 255,415" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" opacity="0.8"/>
            
            {/* Ritual constructors */}
            <circle cx="380" cy="320" r="8" fill="#ec4899" stroke="#db2777" strokeWidth="1" opacity="0.8"/>
            
            {/* Habit constructors */}
            <rect x="320" y="480" width="15" height="8" rx="2" fill="#6366f1" stroke="#4f46e5" strokeWidth="1" opacity="0.8"/>
          </g>

          {/* Flow indicators */}
          <g id="flowIndicators">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                      refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280"/>
              </marker>
            </defs>
            
            {/* Constraint flows */}
            <path d="M 250 320 Q 300 340 350 360" 
                  fill="none" 
                  stroke="#6b7280" 
                  strokeWidth="2" 
                  markerEnd="url(#arrowhead)"
                  opacity="0.6"/>
            
            <path d="M 400 480 Q 450 460 500 440" 
                  fill="none" 
                  stroke="#6b7280" 
                  strokeWidth="2" 
                  markerEnd="url(#arrowhead)"
                  opacity="0.6"/>
          </g>
        </g>

        {/* Axis labels */}
        <text x="525" y="690" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#374151">
          Time to Change (Logarithmic Scale)
        </text>
        
        <text x="25" y="365" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#374151" transform="rotate(-90, 25, 365)">
          Energy Cost of Change
        </text>
      </g>

      {/* Legend */}
      <g id="legend" transform="translate(20, 20)">
        <rect x="0" y="0" width="180" height="200" fill="white" stroke="#d1d5db" strokeWidth="1" rx="5" opacity="0.95"/>
        
        <text x="10" y="20" fontSize="14" fontWeight="bold" fill="#374151">Constraint Types</text>
        
        {/* Robust constraints */}
        <text x="10" y="40" fontSize="12" fontWeight="bold" fill="#6b7280">Robust:</text>
        <rect x="15" y="48" width="8" height="8" fill="#ef4444"/>
        <text x="28" y="57" fontSize="10" fill="#374151">Rigid/Fixed</text>
        
        <polygon points="15,68 20,63 25,68 20,73" fill="#f59e0b"/>
        <text x="28" y="72" fontSize="10" fill="#374151">Elastic/Flexible</text>
        
        <rect x="15" y="78" width="8" height="8" fill="#84cc16" stroke="#65a30d"/>
        <text x="28" y="87" fontSize="10" fill="#374151">Tethered</text>
        
        {/* Resilient constraints */}
        <text x="10" y="105" fontSize="12" fontWeight="bold" fill="#6b7280">Resilient:</text>
        <circle cx="19" cy="115" r="4" fill="#10b981"/>
        <text x="28" y="120" fontSize="10" fill="#374151">Permeable</text>
        
        <polygon points="15,130 20,125 25,130 25,135 20,140 15,135" fill="#8b5cf6"/>
        <text x="28" y="135" fontSize="10" fill="#374151">Phase Shift</text>
        
        <circle cx="19" cy="150" r="4" fill="#374151" opacity="0.5"/>
        <text x="28" y="155" fontSize="10" fill="#374151">Dark/Hidden</text>
        
        <text x="10" y="175" fontSize="12" fontWeight="bold" fill="#6b7280">Constructors:</text>
        <polygon points="15,183 25,180 30,185 25,190 15,188" fill="#3b82f6" opacity="0.8"/>
        <text x="35" y="188" fontSize="10" fill="#374151">Process</text>
      </g>

      {/* Title */}
      <text x={width/2} y="35" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#1f2937">
        Estuarine Map Template
      </text>
      <text x={width/2} y="55" textAnchor="middle" fontSize="12" fill="#6b7280">
        Complexity-informed constraint mapping framework by David Snowden
      </text>
    </svg>
  );
};

export default EstuarineMapTemplate;