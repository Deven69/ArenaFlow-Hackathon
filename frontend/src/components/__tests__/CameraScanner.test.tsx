import { render, screen, fireEvent } from '@testing-library/react';
import CameraScanner from '../CameraScanner';
import { vi, describe, it, expect } from 'vitest';

vi.mock('navigator.mediaDevices', () => ({
  getUserMedia: vi.fn().mockResolvedValue({})
}));

describe('CameraScanner', () => {
  it('renders without crashing', () => {
    render(<CameraScanner onClose={() => {}} onScan={() => {}} />);
  });

  it('renders key UI elements', () => {
    render(<CameraScanner isOpen={true} onClose={() => {}} onScanComplete={() => {}} />);
    expect(screen.getByText('Scan Ticket')).toBeInTheDocument();
  });

  it('calls correct callback when close action is triggered', () => {
    const mockOnClose = vi.fn();
    render(<CameraScanner isOpen={true} onClose={mockOnClose} onScanComplete={() => {}} />);
    
    const closeBtn = screen.getByLabelText('Close scanner');
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
