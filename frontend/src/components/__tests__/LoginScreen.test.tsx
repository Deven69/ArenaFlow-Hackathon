import { render, screen, fireEvent } from '@testing-library/react';
import LoginScreen from '../LoginScreen';
import { vi, describe, it, expect } from 'vitest';

describe('LoginScreen', () => {
  it('renders without crashing', () => {
    render(<LoginScreen onLogin={() => {}} />);
  });

  it('renders key UI elements', () => {
    render(<LoginScreen onLogin={() => {}} />);
    expect(screen.getByText('ArenaFlow')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Login with Google')).toBeInTheDocument();
  });

  it('calls correct callback when primary action is triggered', () => {
    const mockOnLogin = vi.fn();
    render(<LoginScreen onLogin={mockOnLogin} />);
    
    const button = screen.getByText('Login with Google').closest('button');
    if (button) {
      fireEvent.click(button);
      expect(mockOnLogin).toHaveBeenCalled();
    } else {
      throw new Error("Login button not found");
    }
  });
});
