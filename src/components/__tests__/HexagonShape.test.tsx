import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HexagonShape } from '../HexagonShape'
import { HexieReference } from '@/types'

// Mock the StableModal component
jest.mock('../StableModal', () => ({
  StableModal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => 
    isOpen ? <div data-testid="modal">{children}</div> : null,
}))

describe('HexagonShape', () => {
  const defaultProps = {
    title: 'Test Hexagon',
    frontText: 'Front content',
    backText: 'Back content',
  }

  const mockReferences: HexieReference[] = [
    {
      id: '1',
      title: 'Test Research Paper',
      url: 'https://example.com/paper',
      type: 'research' as const,
      authors: 'John Doe',
      publication: 'Test Journal',
      year: 2023,
      description: 'A comprehensive study on testing',
    },
    {
      id: '2',
      title: 'Video Tutorial',
      url: 'https://example.com/video',
      type: 'video' as const,
      description: 'Educational video content',
    },
  ]

  it('renders hexagon with title and front text by default', () => {
    render(<HexagonShape {...defaultProps} />)
    
    expect(screen.getByText('Test Hexagon')).toBeInTheDocument()
    expect(screen.getByText('Front content')).toBeInTheDocument()
    expect(screen.getByText('Front')).toBeInTheDocument()
  })

  it('shows back text when flipped', () => {
    render(<HexagonShape {...defaultProps} isFlipped={true} />)
    
    expect(screen.getByText('Test Hexagon')).toBeInTheDocument()
    expect(screen.getByText('Back content')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('calls onFlip when flip button is clicked', () => {
    const mockOnFlip = jest.fn()
    render(<HexagonShape {...defaultProps} onFlip={mockOnFlip} />)
    
    const flipButton = screen.getByTitle('Flip hexagon')
    fireEvent.click(flipButton)
    
    expect(mockOnFlip).toHaveBeenCalledTimes(1)
  })

  it('calls onDelete when delete button is clicked and showDelete is true', () => {
    const mockOnDelete = jest.fn()
    render(<HexagonShape {...defaultProps} onDelete={mockOnDelete} showDelete={true} />)
    
    const deleteButton = screen.getByTitle('Delete hexagon')
    fireEvent.click(deleteButton)
    
    expect(mockOnDelete).toHaveBeenCalledTimes(1)
  })

  it('does not show delete button when showDelete is false', () => {
    render(<HexagonShape {...defaultProps} showDelete={false} />)
    
    expect(screen.queryByTitle('Delete hexagon')).not.toBeInTheDocument()
  })

  it('shows references button when flipped and references exist', () => {
    render(
      <HexagonShape 
        {...defaultProps} 
        isFlipped={true} 
        references={mockReferences} 
      />
    )
    
    expect(screen.getByText('2 Refs')).toBeInTheDocument()
  })

  it('does not show references button when not flipped', () => {
    render(
      <HexagonShape 
        {...defaultProps} 
        isFlipped={false} 
        references={mockReferences} 
      />
    )
    
    expect(screen.queryByText('2 Refs')).not.toBeInTheDocument()
  })

  it('opens references modal when references button is clicked', async () => {
    render(
      <HexagonShape 
        {...defaultProps} 
        isFlipped={true} 
        references={mockReferences} 
      />
    )
    
    const referencesButton = screen.getByText('2 Refs')
    fireEvent.click(referencesButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByText('Test Research Paper')).toBeInTheDocument()
      expect(screen.getByText('Video Tutorial')).toBeInTheDocument()
    })
  })

  it('truncates text when it exceeds maximum length', () => {
    const longTitle = 'This is a very long title that should be truncated'
    const longText = 'This is a very long text content that should be truncated because it exceeds the maximum allowed length for the hexagon display'
    
    render(
      <HexagonShape 
        {...defaultProps} 
        title={longTitle}
        frontText={longText}
        size={140} // Default size
      />
    )
    
    // Text should be truncated (exact truncation depends on size calculation)
    const titleElement = screen.getByText(/This is a very long title/)
    const textElement = screen.getByText(/This is a very long text/)
    
    expect(titleElement).toBeInTheDocument()
    expect(textElement).toBeInTheDocument()
  })

  it('applies custom size and colors', () => {
    const { container } = render(
      <HexagonShape 
        {...defaultProps} 
        size={200}
        color="#ff0000"
        borderColor="#00ff00"
        shadowColor="rgba(255, 0, 0, 0.5)"
      />
    )
    
    const hexagonDiv = container.querySelector('[style*="width: 200px"]')
    expect(hexagonDiv).toBeInTheDocument()
  })

  it('handles click events', () => {
    const mockOnClick = jest.fn()
    const mockOnMouseDown = jest.fn()
    const mockOnDoubleClick = jest.fn()
    
    render(
      <HexagonShape 
        {...defaultProps} 
        onClick={mockOnClick}
        onMouseDown={mockOnMouseDown}
        onDoubleClick={mockOnDoubleClick}
      />
    )
    
    const hexagon = screen.getByText('Test Hexagon').closest('div')
    
    if (hexagon?.parentElement) {
      fireEvent.click(hexagon.parentElement)
      fireEvent.mouseDown(hexagon.parentElement)
      fireEvent.doubleClick(hexagon.parentElement)
      
      expect(mockOnClick).toHaveBeenCalledTimes(1)
      expect(mockOnMouseDown).toHaveBeenCalledTimes(1)
      expect(mockOnDoubleClick).toHaveBeenCalledTimes(1)
    }
  })

  it('displays correct reference type icons and colors', async () => {
    render(
      <HexagonShape 
        {...defaultProps} 
        isFlipped={true} 
        references={mockReferences} 
      />
    )
    
    const referencesButton = screen.getByText('2 Refs')
    fireEvent.click(referencesButton)
    
    await waitFor(() => {
      // Check that different reference types are displayed
      expect(screen.getByText('Research')).toBeInTheDocument()
      expect(screen.getByText('Video')).toBeInTheDocument()
      expect(screen.getByText('View Research')).toBeInTheDocument()
      expect(screen.getByText('Watch Video')).toBeInTheDocument()
    })
  })

  it('handles empty or missing references gracefully', () => {
    render(
      <HexagonShape 
        {...defaultProps} 
        isFlipped={true} 
        references={[]} 
      />
    )
    
    expect(screen.queryByText(/Refs/)).not.toBeInTheDocument()
  })

  it('stops event propagation on button clicks', () => {
    const mockOnClick = jest.fn()
    const mockOnFlip = jest.fn()
    
    render(
      <HexagonShape 
        {...defaultProps} 
        onClick={mockOnClick}
        onFlip={mockOnFlip}
      />
    )
    
    const flipButton = screen.getByTitle('Flip hexagon')
    fireEvent.click(flipButton)
    
    // onFlip should be called but onClick should not (due to stopPropagation)
    expect(mockOnFlip).toHaveBeenCalledTimes(1)
    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('renders with custom className and style', () => {
    const { container } = render(
      <HexagonShape 
        {...defaultProps} 
        className="custom-class"
        style={{ transform: 'rotate(45deg)' }}
      />
    )
    
    const hexagon = container.querySelector('.custom-class')
    expect(hexagon).toBeInTheDocument()
    expect(hexagon).toHaveStyle('transform: rotate(45deg)')
  })
})