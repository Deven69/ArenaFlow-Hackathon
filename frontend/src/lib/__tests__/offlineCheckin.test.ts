import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queueCheckinForSync } from '../offlineCheckin';

describe('offlineCheckin', () => {
  let mockAdd: any;
  let mockRegister: any;
  beforeEach(() => {
    mockAdd = vi.fn();
    mockRegister = vi.fn();
    Object.defineProperty(window, 'indexedDB', {
      value: {
        open: vi.fn().mockImplementation(() => {
          const req: any = {};
          setTimeout(() => {
            if (req.onsuccess) req.onsuccess({ target: { result: { transaction: () => ({ objectStore: () => ({ add: mockAdd }) }) } } });
          }, 0);
          return req;
        }),
      },
      configurable: true
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ sync: { register: mockRegister } }) },
      configurable: true
    });
  });

  it('queues a checkin correctly to DB and registers sync', async () => {
    await queueCheckinForSync('TKT-123', 'test-token');
    expect(mockAdd).toHaveBeenCalled();
    expect(mockRegister).toHaveBeenCalledWith('checkin-sync');
  });
});
