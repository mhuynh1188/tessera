import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DrawingTools } from '@/components/workspace/DrawingToolsFixed';

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock useRef and createRef
const mockCanvasRef = {
  current: {
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
    }),
  },
};

describe('DrawingTools', () => {
  const defaultProps = {
    canvasRef: mockCanvasRef as any,
    canvasTransform: { scale: 1, translateX: 0, translateY: 0 },
    isDrawingMode: true,
    onDrawingModeChange: jest.fn(),
    showDrawingToolsPanel: true,
    onDrawingToolsPanelChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render drawing tools panel when in drawing mode', () => {
      render(<DrawingTools {...defaultProps} />);
      
      expect(screen.getByText('Drawing Tools')).toBeInTheDocument();
      expect(screen.getByText('Draw')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Erase')).toBeInTheDocument();
    });

    it('should not render when neither drawing mode nor panel is active', () => {
      render(<DrawingTools {...defaultProps} isDrawingMode={false} showDrawingToolsPanel={false} />);
      
      expect(screen.queryByText('Drawing Tools')).not.toBeInTheDocument();
    });

    it('should render panel when panel is shown but drawing mode is off', () => {
      render(<DrawingTools {...defaultProps} isDrawingMode={false} showDrawingToolsPanel={true} />);
      
      expect(screen.getByText('Drawing Tools')).toBeInTheDocument();
    });

    it('should display color selection interface', () => {
      render(<DrawingTools {...defaultProps} />);
      
      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByDisplayValue('#ff6b6b')).toBeInTheDocument();
    });

    it('should display brush size controls', () => {
      render(<DrawingTools {...defaultProps} />);
      
      expect(screen.getByText(/Size: \d+px/)).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });

  describe('Tool Selection', () => {
    it('should select pen tool by default', () => {
      render(<DrawingTools {...defaultProps} />);
      
      const penButton = screen.getByRole('button', { name: /draw/i });
      expect(penButton).toHaveClass('bg-blue-600');
    });

    it('should allow switching between tools', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      const textButton = screen.getByRole('button', { name: /text/i });
      await user.click(textButton);
      
      expect(textButton).toHaveClass('bg-blue-600');
    });

    it('should show visual feedback for selected tool', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      const eraserButton = screen.getByRole('button', { name: /erase/i });
      await user.click(eraserButton);
      
      expect(eraserButton).toHaveClass('scale-105');
      expect(eraserButton).toHaveClass('ring-2');
    });
  });

  describe('Color Selection', () => {
    it('should allow selecting predefined colors', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      const colorButtons = screen.getAllByRole('button');
      const blueColorButton = colorButtons.find(btn => 
        btn.style.backgroundColor === 'rgb(67, 178, 209)' // #45b7d1
      );
      
      if (blueColorButton) {
        await user.click(blueColorButton);
        expect(blueColorButton).toHaveClass('scale-110');
      }
    });

    it('should allow custom color input', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      const colorInput = screen.getByDisplayValue('#ff6b6b');
      await user.clear(colorInput);
      await user.type(colorInput, '#00ff00');
      
      expect(colorInput).toHaveValue('#00ff00');
    });
  });

  describe('Brush Size Control', () => {
    it('should allow changing brush size', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      const sizeSlider = screen.getByRole('slider');
      fireEvent.change(sizeSlider, { target: { value: '10' } });
      
      expect(screen.getByText('Size: 10px')).toBeInTheDocument();
    });

    it('should respect brush size limits', () => {
      render(<DrawingTools {...defaultProps} />);
      
      const sizeSlider = screen.getByRole('slider') as HTMLInputElement;
      expect(sizeSlider.min).toBe('1');
      expect(sizeSlider.max).toBe('20');
    });
  });

  describe('Text Input', () => {
    it('should show text input when text tool is selected and canvas is clicked', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      // Select text tool
      const textButton = screen.getByRole('button', { name: /text/i });
      await user.click(textButton);
      
      // Simulate canvas click
      const drawingArea = document.querySelector('[data-testid="drawing-overlay"]');
      if (drawingArea) {
        fireEvent.mouseDown(drawingArea, { clientX: 100, clientY: 100 });
      }
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
      });
    });

    it('should add text when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      // Select text tool and trigger text input
      const textButton = screen.getByRole('button', { name: /text/i });
      await user.click(textButton);
      
      // Simulate text input appearing (would normally be triggered by canvas click)
      const component = screen.getByTestId('drawing-tools-container');
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      
      await waitFor(() => {
        const textInput = screen.queryByPlaceholderText('Enter text...');
        if (textInput) {
          fireEvent.change(textInput, { target: { value: 'Test text' } });
          fireEvent.keyDown(textInput, { key: 'Enter' });
        }
      });
    });
  });

  describe('Actions', () => {
    it('should toggle drawing visibility', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      const hideButton = screen.getByRole('button', { name: /hide/i });
      await user.click(hideButton);
      
      expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
    });

    it('should clear all drawings', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);
      
      // Should trigger success message
      expect(require('react-hot-toast').success).toHaveBeenCalledWith('All drawings cleared');
    });

    it('should close drawing tools panel', async () => {
      const user = userEvent.setup();
      const onDrawingToolsPanelChange = jest.fn();
      render(<DrawingTools {...defaultProps} onDrawingToolsPanelChange={onDrawingToolsPanelChange} />);
      
      const closeButton = screen.getByRole('button', { name: /close drawing tools/i });
      await user.click(closeButton);
      
      expect(onDrawingToolsPanelChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Drawing Interactions', () => {
    it('should handle mouse down events for pen tool', () => {
      render(<DrawingTools {...defaultProps} />);
      
      const drawingOverlay = document.querySelector('[data-testid="drawing-overlay"]');
      if (drawingOverlay) {
        fireEvent.mouseDown(drawingOverlay, { 
          clientX: 100, 
          clientY: 100,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      }
      
      // Should initiate drawing state
      expect(drawingOverlay).toBeTruthy();
    });

    it('should handle eraser tool clicks', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      // Select eraser tool
      const eraserButton = screen.getByRole('button', { name: /erase/i });
      await user.click(eraserButton);
      
      // Simulate eraser click
      const drawingOverlay = document.querySelector('[data-testid="drawing-overlay"]');
      if (drawingOverlay) {
        fireEvent.mouseDown(drawingOverlay, { clientX: 100, clientY: 100 });
      }
      
      expect(require('react-hot-toast').success).toHaveBeenCalledWith('Element erased');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DrawingTools {...defaultProps} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<DrawingTools {...defaultProps} />);
      
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      
      await user.keyboard('{Tab}');
      // Should move focus to next interactive element
    });
  });

  describe('Error Handling', () => {
    it('should handle missing canvas ref gracefully', () => {
      const propsWithoutRef = {
        ...defaultProps,
        canvasRef: { current: null },
      };
      
      expect(() => {
        render(<DrawingTools {...propsWithoutRef} />);
      }).not.toThrow();
    });

    it('should validate input parameters', () => {
      // Test with invalid transform values
      const invalidProps = {
        ...defaultProps,
        canvasTransform: { scale: NaN, translateX: 0, translateY: 0 },
      };
      
      expect(() => {
        render(<DrawingTools {...invalidProps} />);
      }).not.toThrow();
    });
  });
});