import { render, screen, fireEvent } from '@testing-library/react';
import BottomDock, { TabId } from '../BottomDock';
import { vi, describe, it, expect } from 'vitest';

describe('BottomDock', () => {
  it('renders without crashing', () => {
    render(<BottomDock activeTab="home" onTabChange={() => {}} />);
  });

  it('renders key UI elements', () => {
    render(<BottomDock activeTab="home" onTabChange={() => {}} />);
    expect(screen.getByText('Tickets')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
  });

  it('calls correct callback when primary action is triggered', () => {
    const mockOnTabChange = vi.fn();
    render(<BottomDock activeTab="home" onTabChange={mockOnTabChange} />);
    
    // Find the Explore button and click it
    const exploreButton = screen.getByText('Explore').closest('button');
    if (exploreButton) {
      fireEvent.click(exploreButton);
      expect(mockOnTabChange).toHaveBeenCalledWith('explore');
    } else {
      throw new Error("Explore button not found");
    }
  });
});
