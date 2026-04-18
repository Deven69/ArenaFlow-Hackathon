export interface Ticket {
  id: string;
  matchTitle: string;
  teamA: string;
  teamB: string;
  venue: string;
  date: string;
  time: string;
  section: string;
  block: string;
  row: string;
  seat: string;
  tier: 'Gold' | 'Silver' | 'Standard';
  userName: string;
  qrCode: string;
}

export interface Gate {
  id: string;
  name: string;
  waitMinutes: number;
  congestion: 'low' | 'medium' | 'high';
}

export interface FoodOrder {
  id: string;
  item: string;
  price: number;
  status: 'preparing' | 'ready' | 'delivered';
  estimatedMins: number;
}

export const mockTicket: Ticket = {
  id: 'TKT-2024-FINALE-001',
  matchTitle: 'IPL 2024: The Finale',
  teamA: 'Mumbai Indians',
  teamB: 'Chennai Super Kings',
  venue: 'Narendra Modi Stadium',
  date: '2024-05-26',
  time: '19:30 IST',
  section: 'Premium Lounge',
  block: 'B3',
  row: '12',
  seat: '18',
  tier: 'Gold',
  userName: 'Deven Dhule',
  qrCode: 'ARENAFLOW-TKT-2024-FINALE-001',
};

export const mockGates: Gate[] = [
  { id: 'A', name: 'Gate A', waitMinutes: 12, congestion: 'high' },
  { id: 'B', name: 'Gate B', waitMinutes: 4, congestion: 'low' },
  { id: 'C', name: 'Gate C', waitMinutes: 8, congestion: 'medium' },
  { id: 'D', name: 'Gate D', waitMinutes: 15, congestion: 'high' },
  { id: 'E', name: 'Gate E', waitMinutes: 6, congestion: 'low' },
];

export const mockFoodOrders: FoodOrder[] = [
  { id: 'ORD-001', item: 'Masala Dosa + Cold Coffee', price: 320, status: 'preparing', estimatedMins: 12 },
  { id: 'ORD-002', item: 'Veg Biryani Combo', price: 450, status: 'ready', estimatedMins: 0 },
];

export const optimizedGate = {
  gate: 'Gate B',
  savedMinutes: 8,
  distance: '200m',
};
