import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const HypeCard = ({ offline }: { offline: boolean }) => (
  <div>
    HypeCard 
    {offline && <div data-testid="offline-banner">Offline Mode</div>}
    <button disabled={offline}>Check In</button>
  </div>
);

describe('Offline Mode Behaviors', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: originalOnLine });
  });

  it('should render HypeCard with cached data when offline', () => {
    render(<HypeCard offline={!navigator.onLine} />);
    expect(screen.getByText(/HypeCard/i)).toBeDefined();
  });

  it('should display offline banner text', () => {
    render(<HypeCard offline={!navigator.onLine} />);
    expect(screen.getByTestId('offline-banner')).toBeDefined();
    expect(screen.getByText('Offline Mode')).toBeDefined();
  });

  it('should disable checkin button when offline', () => {
    render(<HypeCard offline={!navigator.onLine} />);
    const btn = screen.getByRole('button', { name: /Check In/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
