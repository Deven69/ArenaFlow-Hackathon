import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shareGroupInvite } from '../shareInvite';

describe('shareGroupInvite', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(navigator, 'share', { value: vi.fn(), configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: vi.fn().mockReturnValue(true), configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
  });

  it('shares successfully if native share available', async () => {
    (navigator.share as any).mockResolvedValue(undefined);
    const result = await shareGroupInvite('123', 'My Group', 'Match 1');
    expect(result).toBe('shared');
    expect(navigator.share).toHaveBeenCalled();
  });

  it('copies to clipboard if share rejects with non-abort error', async () => {
    (navigator.share as any).mockRejectedValue(new Error('Some error'));
    (navigator.clipboard.writeText as any).mockResolvedValue(undefined);
    const result = await shareGroupInvite('123', 'My Group', 'Match 1');
    expect(result).toBe('copied');
  });

  it('cancels if share aborted', async () => {
    const error = new Error('AbortError');
    error.name = 'AbortError';
    (navigator.share as any).mockRejectedValue(error);
    const result = await shareGroupInvite('123', 'My Group', 'Match 1');
    expect(result).toBe('cancelled');
  });
});
