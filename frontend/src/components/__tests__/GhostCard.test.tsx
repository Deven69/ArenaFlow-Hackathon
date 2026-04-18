import { render, screen, fireEvent } from '@testing-library/react';
import GhostCard from '../GhostCard';
import { vi, describe, it, expect } from 'vitest';

describe('GhostCard', () => {
  it('renders without crashing', () => {
    render(<GhostCard onScan={() => {}} />);
  });

  it('renders key UI elements', () => {
    render(<GhostCard onScan={() => {}} />);
    expect(screen.getByText('Digitize Your Ticket')).toBeInTheDocument();
    expect(screen.getByText('Scan Ticket')).toBeInTheDocument();
  });

  it('calls correct callback when primary action is triggered', () => {
    const mockOnScan = vi.fn();
    render(<GhostCard onScan={mockOnScan} />);
    
    const button = screen.getByText('Scan Ticket').closest('button');
    if (button) {
      fireEvent.click(button);
      expect(mockOnScan).toHaveBeenCalled();
    } else {
      throw new Error("Scan button not found");
    }
  });
});
