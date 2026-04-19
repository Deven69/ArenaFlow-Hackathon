import { z } from 'zod';
import type { Group } from './group';
import type { Ticket } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { ERRORS } from '@/lib/errors';
export interface CheckInResult {
  success: boolean;
  checkedInTickets?: Array<{
    ticketId: string;
    checkedInAt: string;
  }>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface GroupCheckIn {
  groupId: string;
  checkedInAt: string;
  tickets: string[];
}

const getStoredCheckIns = (): GroupCheckIn[] => {
  return JSON.parse(localStorage.getItem('arenaFlow_checkins') || '[]') as GroupCheckIn[];
};

const getIndividualCheckIns = (): Record<string, { checkedInAt: string; ticketId: string }> => {
  return JSON.parse(localStorage.getItem('arenaFlow_individual_checkins') || '{}') as Record<
    string,
    { checkedInAt: string; ticketId: string }
  >;
};

const saveCheckIns = (checkIns: GroupCheckIn[]): void => {
  localStorage.setItem('arenaFlow_checkins', JSON.stringify(checkIns));
};

export const GroupCheckinSchema = z.object({
  group: z.any().refine(val => val && val.id, "Invalid Group payload"),
  performedBy: z.string().optional()
});

/**
 * Checks in a complete multiplexed array of tickets simultaneously.
 * Posts analytic payloads utilizing safe parsing boundaries.
 * 
 * @param {Group} group - Full group object
 * @param {string} performedBy - ID of staff executing batch scan
 * @returns {Promise<CheckInResult>} Standardized success logs or mapped unified error schemas.
 */
export async function checkInGroup(
  group: Group,
  performedBy?: string
): Promise<CheckInResult> {
  const validation = GroupCheckinSchema.safeParse({ group, performedBy });
  if (!validation.success) {
    return {
       success: false,
       error: { code: 'VALIDATION_ERROR', message: 'Payload verification failed', details: validation.error.format() }
    }
  }
  const existingCheckIns = getStoredCheckIns();
  const existingCheckIn = existingCheckIns.find((ci) => ci.groupId === group.id);

  if (existingCheckIn) {
    return {
      success: false,
      error: {
        code: 'GROUP_ALREADY_CHECKED_IN',
        message: `Group was already checked in at ${new Date(existingCheckIn.checkedInAt).toLocaleString()}`,
        details: {
          alreadyCheckedInAt: existingCheckIn.checkedInAt,
        },
      },
    };
  }

  const individualCheckIns = getIndividualCheckIns();
  for (const ticket of group.tickets) {
    if (individualCheckIns[ticket.id]) {
      return {
        success: false,
        error: {
          code: 'TICKET_ALREADY_SCANNED',
          message: `Ticket ${ticket.id} was already scanned individually before group check-in`,
          details: {
            conflictedTicketId: ticket.id,
            alreadyCheckedInAt: individualCheckIns[ticket.id].checkedInAt,
          },
        },
      };
    }
  }

  const checkedInAt = new Date().toISOString();
  const ticketIds = group.tickets.map((t) => t.id);

  existingCheckIns.push({
    groupId: group.id,
    checkedInAt,
    tickets: ticketIds,
  });
  saveCheckIns(existingCheckIns);

  group.tickets.forEach((ticket) => {
    (ticket as Ticket & { checkedIn?: boolean; checkedInAt?: string }).checkedIn = true;
    (ticket as Ticket & { checkedIn?: boolean; checkedInAt?: string }).checkedInAt = checkedInAt;
  });

  // Log to BigQuery async without blocking
  fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://x.supabase.co'}/functions/v1/log-analytics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
    },
    body: JSON.stringify({
      action: "checkin_events",
      payload: {
        event_id: group.tickets[0]?.matchTitle,
        is_group_checkin: true,
        group_size: group.tickets.length,
        fan_id: performedBy || 'anonymous',
        session_id: crypto.randomUUID()
      }
    })
  }).catch((e) => console.error("Analytics failure", e));

  await import('./group').then(({ saveGroup }) => saveGroup(group));

  return {
    success: true,
    checkedInTickets: group.tickets.map((t) => ({
      ticketId: t.id,
      checkedInAt,
    })),
  };
}

export const TicketCheckinSchema = z.object({
  ticket: z.any().refine(val => val !== undefined, "Invalid Ticket payload"),
});

/**
 * Checks in a standalone fan ticket and streams native logs down to edge environments.
 * 
 * @param {Ticket} ticket - Standalone single ticket element.
 * @returns {Promise<CheckInResult>} Execution log statuses.
 */
export async function checkInIndividualTicket(
  ticket: Ticket & { checkedIn?: boolean }
): Promise<CheckInResult> {
  const validation = TicketCheckinSchema.safeParse({ ticket });
  if (!validation.success) {
    return {
       success: false,
       error: { code: 'VALIDATION_ERROR', message: 'Payload verification failed', details: validation.error.format() }
    }
  }
  if (ticket.checkedIn) {
    return {
      success: false,
      error: {
        code: 'TICKET_ALREADY_SCANNED',
        message: `Ticket ${ticket.id} has already been checked in`,
        details: {
          conflictedTicketId: ticket.id,
        },
      },
    };
  }

  // BOLA prevention: verify the ticket belongs to the authenticated user
  // OR the caller has staff/admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw ERRORS.UNAUTHORIZED();

  // Get caller role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Fans can only checkin their own ticket
  // Staff and admin can checkin any ticket
  if (profile?.role === 'fan') {
    const { data: ticketOwner } = await supabase
      .from('tickets')
      .select('owner_id')
      .eq('qr_value', ticket.qrCode || ticket.id)
      .single();
      
    if (!ticketOwner || ticketOwner.owner_id !== user.id) {
      throw ERRORS.UNAUTHORIZED();
    }
  }

  const checkedInAt = new Date().toISOString();
  const individualCheckIns = getIndividualCheckIns();
  individualCheckIns[ticket.id] = {
    checkedInAt,
    ticketId: ticket.id,
  };
  localStorage.setItem('arenaFlow_individual_checkins', JSON.stringify(individualCheckIns));

  ticket.checkedIn = true;
  (ticket as Ticket & { checkedInAt?: string }).checkedInAt = checkedInAt;

  // Log to BigQuery async
  fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://x.supabase.co'}/functions/v1/log-analytics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
    },
    body: JSON.stringify({
      action: "checkin_events",
      payload: {
        event_id: ticket.matchTitle || 'unknown',
        ticket_tier: ticket.tier,
        is_group_checkin: false,
        group_size: 1,
        fan_id: ticket.userName || 'anonymous',
        session_id: crypto.randomUUID()
      }
    })
  }).catch((e) => console.error("Analytics failure", e));

  return {
    success: true,
    checkedInTickets: [
      {
        ticketId: ticket.id,
        checkedInAt,
      },
    ],
  };
}

export function isGroupCheckedIn(groupId: string): boolean {
  const checkIns = getStoredCheckIns();
  return checkIns.some((ci) => ci.groupId === groupId);
}

export function isTicketIndividuallyCheckedIn(ticketId: string): boolean {
  const individualCheckIns = getIndividualCheckIns();
  return !!individualCheckIns[ticketId];
}
