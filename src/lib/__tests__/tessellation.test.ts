import { HexagonTessellation } from '../tessellation'

describe('HexagonTessellation', () => {
  let tessellation: HexagonTessellation

  beforeEach(() => {
    tessellation = new HexagonTessellation(50) // 50px radius
  })

  describe('constructor', () => {
    it('should initialize with correct size', () => {
      expect(tessellation.size).toBe(50)
    })

    it('should set default canvas dimensions', () => {
      expect(tessellation.width).toBe(1200)
      expect(tessellation.height).toBe(800)
    })
  })

  describe('hexToPixel', () => {
    it('should convert hex coordinates to pixel coordinates correctly', () => {
      const result = tessellation.hexToPixel(0, 0)
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('should handle positive coordinates', () => {
      const result = tessellation.hexToPixel(1, 1)
      expect(result.x).toBeCloseTo(86.6, 1) // Math.sqrt(3) * 50
      expect(result.y).toBeCloseTo(75, 1) // 1.5 * 50
    })

    it('should handle negative coordinates', () => {
      const result = tessellation.hexToPixel(-1, -1)
      expect(result.x).toBeCloseTo(-86.6, 1)
      expect(result.y).toBeCloseTo(-75, 1)
    })
  })

  describe('pixelToHex', () => {
    it('should convert pixel coordinates to hex coordinates', () => {
      const result = tessellation.pixelToHex(0, 0)
      expect(result.q).toBe(0)
      expect(result.r).toBe(0)
    })

    it('should round to nearest hex coordinate', () => {
      const result = tessellation.pixelToHex(50, 50)
      // Should round to nearest valid hex coordinate
      expect(Number.isInteger(result.q)).toBe(true)
      expect(Number.isInteger(result.r)).toBe(true)
    })
  })

  describe('getNeighbors', () => {
    it('should return 6 neighbors for any hex', () => {
      const neighbors = tessellation.getNeighbors(0, 0)
      expect(neighbors).toHaveLength(6)
    })

    it('should return correct neighbor coordinates', () => {
      const neighbors = tessellation.getNeighbors(0, 0)
      const expectedNeighbors = [
        { q: 1, r: 0 },
        { q: 1, r: -1 },
        { q: 0, r: -1 },
        { q: -1, r: 0 },
        { q: -1, r: 1 },
        { q: 0, r: 1 },
      ]
      
      expectedNeighbors.forEach((expected, index) => {
        expect(neighbors[index]).toEqual(expected)
      })
    })
  })

  describe('distance', () => {
    it('should return 0 for same hex', () => {
      expect(tessellation.distance(0, 0, 0, 0)).toBe(0)
    })

    it('should return 1 for adjacent hexes', () => {
      expect(tessellation.distance(0, 0, 1, 0)).toBe(1)
      expect(tessellation.distance(0, 0, 0, 1)).toBe(1)
    })

    it('should calculate correct distance for non-adjacent hexes', () => {
      expect(tessellation.distance(0, 0, 2, 0)).toBe(2)
      expect(tessellation.distance(0, 0, 1, 1)).toBe(2)
    })
  })

  describe('findPath', () => {
    it('should return empty array for same start and end', () => {
      const path = tessellation.findPath(0, 0, 0, 0)
      expect(path).toEqual([])
    })

    it('should return direct path for adjacent hexes', () => {
      const path = tessellation.findPath(0, 0, 1, 0)
      expect(path).toHaveLength(1)
      expect(path[0]).toEqual({ q: 1, r: 0 })
    })

    it('should find path between distant hexes', () => {
      const path = tessellation.findPath(0, 0, 2, 0)
      expect(path).toHaveLength(2)
      expect(path[1]).toEqual({ q: 2, r: 0 })
    })
  })

  describe('isValidHex', () => {
    it('should return true for coordinates within canvas bounds', () => {
      expect(tessellation.isValidHex(0, 0)).toBe(true)
      expect(tessellation.isValidHex(5, 5)).toBe(true)
    })

    it('should return false for coordinates outside canvas bounds', () => {
      // These should be outside the reasonable bounds for a 1200x800 canvas
      expect(tessellation.isValidHex(100, 100)).toBe(false)
      expect(tessellation.isValidHex(-100, -100)).toBe(false)
    })
  })

  describe('getHexAtPosition', () => {
    it('should return hex coordinates for a given pixel position', () => {
      const hex = tessellation.getHexAtPosition(100, 100)
      expect(typeof hex.q).toBe('number')
      expect(typeof hex.r).toBe('number')
    })

    it('should handle edge cases', () => {
      const hex = tessellation.getHexAtPosition(0, 0)
      expect(hex.q).toBe(0)
      expect(hex.r).toBe(0)
    })
  })

  describe('snapToGrid', () => {
    it('should snap position to nearest hex center', () => {
      const snapped = tessellation.snapToGrid(45, 35)
      const hex = tessellation.pixelToHex(45, 35)
      const expected = tessellation.hexToPixel(hex.q, hex.r)
      
      expect(snapped.x).toBeCloseTo(expected.x, 1)
      expect(snapped.y).toBeCloseTo(expected.y, 1)
    })

    it('should return same position if already on grid', () => {
      const gridPosition = tessellation.hexToPixel(1, 1)
      const snapped = tessellation.snapToGrid(gridPosition.x, gridPosition.y)
      
      expect(snapped.x).toBeCloseTo(gridPosition.x, 1)
      expect(snapped.y).toBeCloseTo(gridPosition.y, 1)
    })
  })

  describe('edge cases and boundary conditions', () => {
    it('should handle zero size gracefully', () => {
      const zeroTessellation = new HexagonTessellation(0)
      expect(zeroTessellation.size).toBe(0)
      
      const result = zeroTessellation.hexToPixel(1, 1)
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('should handle very large coordinates', () => {
      const result = tessellation.hexToPixel(1000, 1000)
      expect(Number.isFinite(result.x)).toBe(true)
      expect(Number.isFinite(result.y)).toBe(true)
    })

    it('should handle floating point coordinates', () => {
      const result = tessellation.hexToPixel(1.5, 1.5)
      expect(Number.isFinite(result.x)).toBe(true)
      expect(Number.isFinite(result.y)).toBe(true)
    })
  })
})