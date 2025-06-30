// Advanced Hexagon Tessellation System
// Implements perfect hexagonal tessellation with edge snapping

export interface HexPosition {
  x: number;
  y: number;
  q: number; // Hexagonal grid coordinate Q
  r: number; // Hexagonal grid coordinate R
  s: number; // Hexagonal grid coordinate S (q + r + s = 0)
}

export interface HexagonDimensions {
  size: number;      // Radius from center to vertex
  width: number;     // Point to point width
  height: number;    // Flat to flat height
}

export class HexagonTessellation {
  private size: number;
  private dimensions: HexagonDimensions;
  private snapThreshold: number;

  constructor(hexSize: number = 175, snapThreshold: number = 200) {
    this.size = hexSize;
    this.snapThreshold = snapThreshold;
    this.dimensions = this.calculateDimensions(hexSize);
  }

  private calculateDimensions(size: number): HexagonDimensions {
    return {
      size,
      width: size * 2,
      height: size * Math.sqrt(3),
    };
  }

  // Convert pixel coordinates to hexagonal grid coordinates
  pixelToHex(x: number, y: number): HexPosition {
    const q = (Math.sqrt(3)/3 * x - 1/3 * y) / this.size;
    const r = (2/3 * y) / this.size;
    const s = -q - r;

    // Round to nearest hex
    const roundedQ = Math.round(q);
    const roundedR = Math.round(r);
    const roundedS = Math.round(s);

    const qDiff = Math.abs(q - roundedQ);
    const rDiff = Math.abs(r - roundedR);
    const sDiff = Math.abs(s - roundedS);

    if (qDiff > rDiff && qDiff > sDiff) {
      const finalQ = -roundedR - roundedS;
      return {
        x,
        y,
        q: finalQ,
        r: roundedR,
        s: roundedS
      };
    } else if (rDiff > sDiff) {
      const finalR = -roundedQ - roundedS;
      return {
        x,
        y,
        q: roundedQ,
        r: finalR,
        s: roundedS
      };
    } else {
      const finalS = -roundedQ - roundedR;
      return {
        x,
        y,
        q: roundedQ,
        r: roundedR,
        s: finalS
      };
    }
  }

  // Convert hexagonal grid coordinates to pixel coordinates (for edge-to-edge connection)
  hexToPixel(q: number, r: number): { x: number; y: number } {
    // For perfect edge-to-edge tessellation like Lego pieces
    // Use the actual hexagon geometry where adjacent hexagons share an edge
    const hexWidth = this.size * Math.sqrt(3); // Width between parallel sides
    const hexHeight = this.size * 1.5; // Height between adjacent row centers
    
    // Standard hexagonal tessellation coordinates
    const x = hexWidth * (q + r/2);
    const y = hexHeight * r;
    
    return { x, y };
  }

  // Get perfect tessellation position for given coordinates
  getTessellationPosition(x: number, y: number): { x: number; y: number } {
    const hex = this.pixelToHex(x, y);
    return this.hexToPixel(hex.q, hex.r);
  }

  // Check if position should snap to nearby hexagons
  shouldSnap(
    x: number, 
    y: number, 
    occupiedPositions: Array<{ x: number; y: number; id: string }> = []
  ): { shouldSnap: boolean; snapPosition?: { x: number; y: number }; snapToId?: string } {
    
    // If no other hexagons exist, don't snap
    if (occupiedPositions.length === 0) {
      return { shouldSnap: false };
    }

    // Find the nearest hexagon
    let nearestHexagon: { x: number; y: number; id: string } | null = null;
    let nearestDistance = Infinity;
    
    for (const hexagon of occupiedPositions) {
      const distance = Math.sqrt(
        Math.pow(x - hexagon.x, 2) + Math.pow(y - hexagon.y, 2)
      );
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestHexagon = hexagon;
      }
    }

    if (!nearestHexagon || nearestDistance > this.snapThreshold * 1.5) {
      return { shouldSnap: false };
    }

    // Calculate the 6 possible snap positions around the nearest hexagon
    const neighbors = this.getNeighbors(
      this.pixelToHex(nearestHexagon.x, nearestHexagon.y).q,
      this.pixelToHex(nearestHexagon.x, nearestHexagon.y).r
    );

    // Find the closest neighbor position to the current position
    let bestSnapPosition: { x: number; y: number } | null = null;
    let bestDistance = Infinity;

    for (const neighbor of neighbors) {
      // Check if this position is already occupied
      const isOccupied = occupiedPositions.some(pos => 
        Math.abs(pos.x - neighbor.x) < 10 && Math.abs(pos.y - neighbor.y) < 10
      );
      
      if (!isOccupied) {
        const distance = Math.sqrt(
          Math.pow(x - neighbor.x, 2) + Math.pow(y - neighbor.y, 2)
        );
        
        if (distance < bestDistance && distance <= this.snapThreshold) {
          bestDistance = distance;
          bestSnapPosition = { x: neighbor.x, y: neighbor.y };
        }
      }
    }

    if (bestSnapPosition) {
      return {
        shouldSnap: true,
        snapPosition: bestSnapPosition,
        snapToId: nearestHexagon.id
      };
    }

    return { shouldSnap: false };
  }

  // Get all neighboring positions for a given hex
  getNeighbors(q: number, r: number): Array<{ x: number; y: number; q: number; r: number }> {
    const directions = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];

    return directions.map(([dq, dr]) => {
      const neighborQ = q + dq;
      const neighborR = r + dr;
      const pos = this.hexToPixel(neighborQ, neighborR);
      return {
        x: pos.x,
        y: pos.y,
        q: neighborQ,
        r: neighborR
      };
    });
  }

  // Find nearest occupied tessellation positions
  findNearestOccupied(
    x: number, 
    y: number, 
    occupiedPositions: Array<{ x: number; y: number; id: string }>
  ): Array<{ position: { x: number; y: number; id: string }; distance: number }> {
    const currentHex = this.pixelToHex(x, y);
    
    return occupiedPositions
      .map(pos => {
        const distance = Math.sqrt(
          Math.pow(x - pos.x, 2) + 
          Math.pow(y - pos.y, 2)
        );
        return { position: pos, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6); // Return 6 nearest neighbors
  }

  // Check if two hexagons are adjacent (touching edges)
  areAdjacent(pos1: { x: number; y: number }, pos2: { x: number; y: number }): boolean {
    const hex1 = this.pixelToHex(pos1.x, pos1.y);
    const hex2 = this.pixelToHex(pos2.x, pos2.y);
    
    const distance = Math.max(
      Math.abs(hex1.q - hex2.q),
      Math.abs(hex1.r - hex2.r),
      Math.abs(hex1.s - hex2.s)
    );
    
    return distance === 1;
  }

  // Get edge connection points between two adjacent hexagons
  getEdgeConnection(
    pos1: { x: number; y: number }, 
    pos2: { x: number; y: number }
  ): { point1: { x: number; y: number }; point2: { x: number; y: number } } | null {
    if (!this.areAdjacent(pos1, pos2)) return null;

    const hex1 = this.pixelToHex(pos1.x, pos1.y);
    const hex2 = this.pixelToHex(pos2.x, pos2.y);

    // Calculate the shared edge midpoint
    const midX = (pos1.x + pos2.x) / 2;
    const midY = (pos1.y + pos2.y) / 2;

    // Calculate edge endpoints based on hexagon geometry
    const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
    const edgeLength = this.size;
    
    const point1 = {
      x: midX + Math.cos(angle + Math.PI/2) * edgeLength/4,
      y: midY + Math.sin(angle + Math.PI/2) * edgeLength/4
    };
    
    const point2 = {
      x: midX + Math.cos(angle - Math.PI/2) * edgeLength/4,
      y: midY + Math.sin(angle - Math.PI/2) * edgeLength/4
    };

    return { point1, point2 };
  }

  // Generate tessellation grid overlay for visual feedback
  generateGridOverlay(
    bounds: { width: number; height: number; offsetX?: number; offsetY?: number }
  ): Array<{ x: number; y: number; q: number; r: number }> {
    const grid: Array<{ x: number; y: number; q: number; r: number }> = [];
    const offsetX = bounds.offsetX || 0;
    const offsetY = bounds.offsetY || 0;

    // Calculate grid bounds in hex coordinates
    const minQ = Math.floor((-offsetX) / (this.dimensions.width * 0.75)) - 2;
    const maxQ = Math.ceil((bounds.width - offsetX) / (this.dimensions.width * 0.75)) + 2;
    const minR = Math.floor((-offsetY) / this.dimensions.height) - 2;
    const maxR = Math.ceil((bounds.height - offsetY) / this.dimensions.height) + 2;

    for (let q = minQ; q <= maxQ; q++) {
      for (let r = minR; r <= maxR; r++) {
        const pos = this.hexToPixel(q, r);
        if (pos.x >= -offsetX - this.size && pos.x <= bounds.width - offsetX + this.size &&
            pos.y >= -offsetY - this.size && pos.y <= bounds.height - offsetY + this.size) {
          grid.push({ x: pos.x, y: pos.y, q, r });
        }
      }
    }

    return grid;
  }

  // Calculate optimal zoom level for tessellation
  getOptimalZoom(containerSize: { width: number; height: number }): number {
    const hexesPerWidth = containerSize.width / this.dimensions.width;
    const hexesPerHeight = containerSize.height / this.dimensions.height;
    
    // Aim for 8-12 hexagons visible across the smaller dimension
    const targetHexes = 10;
    const currentHexes = Math.min(hexesPerWidth, hexesPerHeight);
    
    return targetHexes / currentHexes;
  }

  // Validate tessellation pattern integrity
  validateTessellation(positions: Array<{ x: number; y: number; id: string }>): {
    isValid: boolean;
    gaps: Array<{ x: number; y: number }>;
    overlaps: Array<{ positions: Array<{ x: number; y: number; id: string }> }>;
  } {
    const gaps: Array<{ x: number; y: number }> = [];
    const overlaps: Array<{ positions: Array<{ x: number; y: number; id: string }> }> = [];
    
    // Check for overlapping positions
    const positionMap = new Map<string, Array<{ x: number; y: number; id: string }>>();
    
    positions.forEach(pos => {
      const hex = this.pixelToHex(pos.x, pos.y);
      const key = `${hex.q},${hex.r}`;
      
      if (!positionMap.has(key)) {
        positionMap.set(key, []);
      }
      positionMap.get(key)!.push(pos);
    });

    // Find overlaps
    positionMap.forEach(positionsAtHex => {
      if (positionsAtHex.length > 1) {
        overlaps.push({ positions: positionsAtHex });
      }
    });

    return {
      isValid: overlaps.length === 0,
      gaps,
      overlaps
    };
  }
}

// Export singleton instance
export const tessellation = new HexagonTessellation();