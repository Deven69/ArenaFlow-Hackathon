import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('config', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  
  it('throws if VITE_SUPABASE_URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    await expect(() => import('../config')).rejects.toThrow(
      'Missing required env var: VITE_SUPABASE_URL'
    );
  });
  
  it('exports correct values when env vars present', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
    const { config } = await import('../config');
    expect(config.supabase.url).toBe('https://test.supabase.co');
  });
});
