export class ArenaFlowError extends Error {
  constructor(
    public code: 'SCAN_FAILED' | 'GROUP_FULL' | 'ALREADY_CHECKED_IN' | 
                 'INVALID_BARCODE' | 'RATE_LIMITED' | 'UNAUTHORIZED' | 
                 'PARSE_FAILED' | 'VENUE_NOT_FOUND' | 'TICKET_NOT_FOUND',
    public message: string,
    public statusCode: number,
    public userMessage: string
  ) {
    super(message);
    this.name = 'ArenaFlowError';
  }
}

export const ERRORS = {
  SCAN_FAILED: (detail: string) => new ArenaFlowError('SCAN_FAILED', detail, 422, 'Could not read ticket. Please try again in better lighting.'),
  GROUP_FULL: (max: number) => new ArenaFlowError('GROUP_FULL', `Group at capacity ${max}`, 400, `This group is full. Maximum ${max} members allowed.`),
  ALREADY_CHECKED_IN: () => new ArenaFlowError('ALREADY_CHECKED_IN', 'Ticket already used', 409, 'This ticket has already been scanned.'),
  INVALID_BARCODE: () => new ArenaFlowError('INVALID_BARCODE', 'Barcode verification failed', 400, 'The last 4 digits do not match. Please check your physical ticket.'),
  RATE_LIMITED: () => new ArenaFlowError('RATE_LIMITED', 'Too many requests', 429, 'Too many attempts. Please wait a moment.'),
  UNAUTHORIZED: () => new ArenaFlowError('UNAUTHORIZED', 'Authentication required', 401, 'Please log in to continue.'),
};
