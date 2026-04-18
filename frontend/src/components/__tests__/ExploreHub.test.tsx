import { render, screen } from '@testing-library/react';
import ExploreHub from '../ExploreHub';
import { describe, it, expect } from 'vitest';

describe('ExploreHub', () => {
  it('renders without crashing', () => {
    render(<ExploreHub />);
  });

  it('renders key UI elements', () => {
    render(<ExploreHub />);
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Smart Routing')).toBeInTheDocument();
    expect(screen.getByText('Gate Wait Times')).toBeInTheDocument();
  });
});
