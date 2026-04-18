import { render, screen } from '@testing-library/react';
import FoodOrders from '../FoodOrders';
import { describe, it, expect } from 'vitest';

describe('FoodOrders', () => {
  it('renders without crashing', () => {
    render(<FoodOrders />);
  });

  it('renders key UI elements', () => {
    render(<FoodOrders />);
    expect(screen.getByText('Food Orders')).toBeInTheDocument();
    expect(screen.getByText('Browse Menu')).toBeInTheDocument();
  });
});
