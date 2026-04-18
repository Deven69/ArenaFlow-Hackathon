import { render, screen } from '@testing-library/react';
import { NavLink } from '../NavLink';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

describe('NavLink', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test">Test Link</NavLink>
      </MemoryRouter>
    );
  });

  it('renders key UI elements', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test">Testing URL Render</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText('Testing URL Render')).toBeInTheDocument();
  });
});
