export const shareGroupInvite = async (
  groupId: string,
  groupName: string,
  matchName: string
): Promise<'shared' | 'copied' | 'cancelled'> => {
  const inviteUrl = `${window.location.origin}/join/${groupId}`;
  const shareData = {
    title: 'ArenaFlow Group Entry',
    text: `Join "${groupName}" for ${matchName}. Add your ticket for group entry.`,
    url: inviteUrl
  };

  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled';
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(inviteUrl);
    return 'copied';
  } catch {
    return 'cancelled';
  }
};
