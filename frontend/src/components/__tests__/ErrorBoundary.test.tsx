import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowError = () => { throw new Error('Test error'); };
const NormalChild = () => <div>Normal content</div>;

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><NormalChild /></ErrorBoundary>);
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><ThrowError /></ErrorBoundary>);
    expect(screen.queryByText('Normal content')).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('does not crash the entire app on error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<ErrorBoundary><ThrowError /></ErrorBoundary>);
    }).not.toThrow();
    consoleSpy.mockRestore();
  });
});
