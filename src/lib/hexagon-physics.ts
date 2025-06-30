/**
 * Hexagon Physics Engine - Catan-style snapping and collision detection
 * Treats hexagons as actual hexagonal shapes, not rectangular boxes
 */

export interface Point {
  x: number;
  y: number;
}

export interface HexagonData {
  id: string;
  center: Point;
  size: number; // radius from center to vertex
  rotation?: number; // rotation in radians
}

export interface SnapResult {
  shouldSnap: boolean;
  snapPosition?: Point;
  snapToId?: string;
  snapType?: 'edge' | 'vertex' | 'center';
}

/**
 * Calculate the 6 vertices of a hexagon given its center and size
 */
export function getHexagonVertices(center: Point, size: number, rotation: number = 0): Point[] {
  const vertices: Point[] = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + rotation;
    vertices.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle)
    });
  }
  
  return vertices;
}

/**
 * Check if a point is inside a hexagon using ray casting algorithm
 */
export function isPointInHexagon(point: Point, hexagon: HexagonData): boolean {
  const vertices = getHexagonVertices(hexagon.center, hexagon.size, hexagon.rotation || 0);
  
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Check if two hexagons overlap using actual hexagonal boundaries
 */
export function hexagonsOverlap(hex1: HexagonData, hex2: HexagonData): boolean {
  // Quick distance check first for performance
  const centerDistance = distance(hex1.center, hex2.center);
  const maxDistance = hex1.size + hex2.size;
  
  if (centerDistance > maxDistance) {
    return false;
  }
  
  // Check if any vertex of hex1 is inside hex2
  const hex1Vertices = getHexagonVertices(hex1.center, hex1.size, hex1.rotation || 0);
  for (const vertex of hex1Vertices) {
    if (isPointInHexagon(vertex, hex2)) {
      return true;
    }
  }
  
  // Check if any vertex of hex2 is inside hex1
  const hex2Vertices = getHexagonVertices(hex2.center, hex2.size, hex2.rotation || 0);
  for (const vertex of hex2Vertices) {
    if (isPointInHexagon(vertex, hex1)) {
      return true;
    }
  }
  
  // Check if hexagon centers are very close (for edge cases)
  return centerDistance < (hex1.size + hex2.size) * 0.3;
}

/**
 * Get the 6 perfect tessellation positions around a hexagon (Catan-style)
 */
export function getHexagonTessellationPositions(center: Point, size: number): Point[] {
  const positions: Point[] = [];
  const distance = size * Math.sqrt(3); // Distance between hexagon centers in tessellation
  
  // 6 positions around the hexagon
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    positions.push({
      x: center.x + distance * Math.cos(angle),
      y: center.y + distance * Math.sin(angle)
    });
  }
  
  return positions;
}

/**
 * Find the best snap position for a hexagon with enhanced magnetic edge snapping
 */
export function findSnapPosition(
  draggedHex: HexagonData,
  existingHexagons: HexagonData[],
  snapThreshold: number = 80
): SnapResult {
  let bestSnap: SnapResult = { shouldSnap: false };
  let minDistance = Infinity;
  
  for (const existingHex of existingHexagons) {
    if (existingHex.id === draggedHex.id) continue;
    
    // Enhanced magnetic snapping: Check both tessellation and edge-to-edge positions
    const snapPositions = [
      ...getHexagonTessellationPositions(existingHex.center, existingHex.size),
      ...getMagneticEdgePositions(draggedHex, existingHex)
    ];
    
    for (const snapPos of snapPositions) {
      const dist = distance(draggedHex.center, snapPos);
      
      if (dist < snapThreshold && dist < minDistance) {
        // Check if this position would overlap with other hexagons
        const testHex: HexagonData = {
          ...draggedHex,
          center: snapPos
        };
        
        const wouldOverlap = existingHexagons.some(hex => 
          hex.id !== draggedHex.id && hexagonsOverlap(testHex, hex)
        );
        
        if (!wouldOverlap) {
          minDistance = dist;
          bestSnap = {
            shouldSnap: true,
            snapPosition: snapPos,
            snapToId: existingHex.id,
            snapType: dist < 40 ? 'magnetic-edge' : 'edge'
          };
        }
      }
    }
  }
  
  return bestSnap;
}

/**
 * Get magnetic edge-to-edge snap positions for Lego-like behavior
 */
export function getMagneticEdgePositions(
  draggedHex: HexagonData,
  targetHex: HexagonData
): Point[] {
  const positions: Point[] = [];
  const magneticDistance = (draggedHex.size + targetHex.size) * 0.95; // Slightly overlapping for tight fit
  
  // Calculate 6 magnetic edge positions around the target hexagon
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const magneticPos: Point = {
      x: targetHex.center.x + magneticDistance * Math.cos(angle),
      y: targetHex.center.y + magneticDistance * Math.sin(angle)
    };
    positions.push(magneticPos);
  }
  
  return positions;
}

/**
 * Check if two hexagons are in magnetic range for enhanced snapping feedback
 */
export function isInMagneticRange(
  hex1: HexagonData,
  hex2: HexagonData,
  magneticThreshold: number = 100
): boolean {
  const centerDistance = distance(hex1.center, hex2.center);
  return centerDistance < magneticThreshold;
}

/**
 * Calculate optimal z-index based on hexagon position and interactions
 */
export function calculateOptimalZIndex(
  hexagon: HexagonData,
  allHexagons: HexagonData[],
  isDragging: boolean = false,
  isSelected: boolean = false
): number {
  let baseZIndex = 1;
  
  if (isDragging) return 1000;
  if (isSelected) return 100;
  
  // Higher z-index for hexagons that are more "on top" based on y-position
  baseZIndex = Math.floor(hexagon.center.y / 10);
  
  // Add small increment for overlapping hexagons to prevent z-fighting
  const overlappingCount = allHexagons.filter(other => 
    other.id !== hexagon.id && hexagonsOverlap(hexagon, other)
  ).length;
  
  return baseZIndex + overlappingCount;
}

/**
 * Get safe interaction area for hexagon controls (flip button, etc.)
 * Returns positions that avoid overlapping with other hexagons
 */
export function getSafeInteractionAreas(
  hexagon: HexagonData,
  allHexagons: HexagonData[],
  controlSize: number = 20
): { flip: Point; delete: Point; select: Point } {
  const vertices = getHexagonVertices(hexagon.center, hexagon.size);
  const interactionRadius = hexagon.size + controlSize;
  
  // Preferred positions for controls (around the hexagon)
  const controlPositions = [
    { x: hexagon.center.x + hexagon.size * 0.8, y: hexagon.center.y - hexagon.size * 0.8 }, // top-right
    { x: hexagon.center.x + hexagon.size * 0.8, y: hexagon.center.y + hexagon.size * 0.8 }, // bottom-right
    { x: hexagon.center.x - hexagon.size * 0.8, y: hexagon.center.y - hexagon.size * 0.8 }, // top-left
    { x: hexagon.center.x - hexagon.size * 0.8, y: hexagon.center.y + hexagon.size * 0.8 }, // bottom-left
    { x: hexagon.center.x, y: hexagon.center.y - hexagon.size * 1.2 }, // top-center
    { x: hexagon.center.x, y: hexagon.center.y + hexagon.size * 1.2 }, // bottom-center
  ];
  
  // Find positions that don't overlap with other hexagons
  const safePositions = controlPositions.filter(pos => {
    return !allHexagons.some(other => 
      other.id !== hexagon.id && 
      distance(pos, other.center) < other.size + controlSize
    );
  });
  
  // Return safe positions or fallback to default
  return {
    flip: safePositions[0] || controlPositions[0],
    delete: safePositions[1] || controlPositions[1],
    select: safePositions[2] || controlPositions[2]
  };
}

/**
 * Tessellation grid generation for perfect hexagon placement
 */
export function generateHexagonGrid(
  bounds: { width: number; height: number },
  hexSize: number,
  spacing?: number
): Point[] {
  const gridPoints: Point[] = [];
  
  // Improved tessellation math based on proper hexagon geometry
  // For pointy-top hexagons (which we use), the spacing is different
  const hexWidth = hexSize * 1.5; // Horizontal distance between centers
  const hexHeight = hexSize * Math.sqrt(3); // Full height of hexagon
  const rowHeight = hexHeight * 0.75; // Vertical distance between row centers
  const offsetX = hexWidth * 0.5; // Offset for staggered columns
  
  const cols = Math.ceil(bounds.width / hexWidth) + 3;
  const rows = Math.ceil(bounds.height / rowHeight) + 3;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Stagger every other row for proper tessellation
      const x = col * hexWidth + (row % 2) * offsetX;
      const y = row * rowHeight;
      
      // Include points slightly outside bounds for better edge coverage
      if (x >= -hexSize * 2 && x <= bounds.width + hexSize * 2 && 
          y >= -hexSize * 2 && y <= bounds.height + hexSize * 2) {
        gridPoints.push({ x, y });
      }
    }
  }
  
  return gridPoints;
}

/**
 * Snap to nearest grid position (inspired by Grok tessellation logic)
 * This provides a simpler snapping option for general grid alignment
 */
export function snapToNearestGridPosition(
  position: Point,
  hexSize: number,
  snapDistance: number = hexSize / 2
): Point | null {
  // Generate a small grid around the position to find the nearest grid point
  const gridBounds = {
    width: snapDistance * 4,
    height: snapDistance * 4
  };
  
  const offsetX = position.x - snapDistance * 2;
  const offsetY = position.y - snapDistance * 2;
  
  const gridPoints = generateHexagonGrid(gridBounds, hexSize);
  
  let closest: Point | null = null;
  let minDistance = Infinity;
  
  for (const gridPoint of gridPoints) {
    const adjustedPoint = {
      x: gridPoint.x + offsetX,
      y: gridPoint.y + offsetY
    };
    
    const dist = distance(position, adjustedPoint);
    
    if (dist < snapDistance && dist < minDistance) {
      minDistance = dist;
      closest = adjustedPoint;
    }
  }
  
  return closest;
}

/**
 * Validate if a hexagon can be placed at a position without conflicts
 */
export function canPlaceHexagon(
  position: Point,
  size: number,
  existingHexagons: HexagonData[],
  minDistance?: number
): boolean {
  const testHex: HexagonData = {
    id: 'test',
    center: position,
    size
  };
  
  const effectiveMinDistance = minDistance || size * 0.8;
  
  return !existingHexagons.some(existing => {
    const centerDistance = distance(position, existing.center);
    return centerDistance < effectiveMinDistance || hexagonsOverlap(testHex, existing);
  });
}