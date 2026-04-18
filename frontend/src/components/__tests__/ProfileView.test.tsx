import { render, screen } from '@testing-library/react';
import ProfileView from '../ProfileView';
import { describe, it, expect } from 'vitest';

describe('ProfileView', () => {
  it('renders without crashing', () => {
    render(<ProfileView />);
  });

  it('renders key UI elements', () => {
    render(<ProfileView />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });
});
