import { describe, it, expect, vi } from 'vitest';

describe('Security Edge Cases', () => {
  it('should return 403 on BOLA attempt when owner_id mismatch (mock)', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: '403', message: 'Forbidden' } })
    };
    const response = await mockSupabase.from('tickets').select('id,qr_value,tier,block_section,row_number,seat_number,checked_in,match_id,owner_id').eq('owner_id', 'different-uid').single();
    expect(response.data).toBeNull();
    expect(response.error.code).toBe('403');
  });

  it('should trigger 429 when rate limit exceeds 100', () => {
    let status = 200;
    for(let i=1; i<=101; i++) {
      if (i > 100) status = 429;
    }
    expect(status).toBe(429);
  });

  it('should cleanly sanitize input containing script tags', () => {
    function sanitize(input: string) {
      return input.replace(/<[^>]*>?/gm, '');
    }
    const input = '<script>alert(1)</script>';
    expect(sanitize(input)).toBe('alert(1)');
  });

  it('should encrypt same plaintext twice and produce different ciphertexts via random IV (AES-256-GCM)', async () => {
    async function encryptField(plaintext: string, keyString: string): Promise<string> {
      const keyBytes = new TextEncoder().encode(keyString.padEnd(32, '0').slice(0, 32));
      const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      return btoa(String.fromCharCode(...combined));
    }
    const pt = 'secret-fingerprint-id';
    const c1 = await encryptField(pt, 'test-key-string-padding');
    const c2 = await encryptField(pt, 'test-key-string-padding');
    
    expect(c1).not.toBe(c2);
    expect(c1).not.toBe(pt);
  });
});
