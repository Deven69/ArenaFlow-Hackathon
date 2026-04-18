import { z } from 'zod';
import type { Ticket } from '@/data/mockData';

export const TIER_LIMITS = {
  Standard: 8,
  Silver: 15,
  Gold: 15,
} as const;

export interface Group {
  id: string;
  name: string;
  tickets: Ticket[];
  createdAt: string;
  tier: 'Gold' | 'Silver' | 'Standard';
}

export interface GroupCreateResult {
  success: boolean;
  group?: Group;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const GroupCreateSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50, "Group name too long"),
  tier: z.enum(['Gold', 'Silver', 'Standard']),
  tickets: z.array(z.any()).min(1, "At least 1 ticket required")
});

/**
 * Creates a unique Fan Group binding multiplexed tickets together.
 * Validates capacities and duplications dynamically.
 * 
 * @param {string} name - Desired string name of the group
 * @param {Ticket[]} tickets - Array of Ticket objects
 * @param {'Gold' | 'Silver' | 'Standard'} tier - Enforced limits calculation baseline
 * @returns {Promise<GroupCreateResult>} The newly appended group payload or explicit generic error
 */
export async function createGroup(
  name: string,
  tickets: Ticket[],
  tier: 'Gold' | 'Silver' | 'Standard'
): Promise<GroupCreateResult> {
  const result = GroupCreateSchema.safeParse({ name, tier, tickets });
  
  if (!result.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.format() }
    }
  }

  const { name: validName, tier: validTier } = result.data;
  const maxAllowed = TIER_LIMITS[validTier as 'Gold' | 'Silver' | 'Standard'];

  if (tickets.length > maxAllowed) {
    return {
      success: false,
      error: {
        code: 'TIER_CAP_EXCEEDED',
        message: `Group size exceeds tier cap of ${maxAllowed} for ${tier} tier`,
        details: {
          maxAllowed,
          requested: tickets.length,
        },
      },
    };
  }

  const seenIds = new Set<string>();
  for (const ticket of tickets) {
    if (seenIds.has(ticket.id)) {
      return {
        success: false,
        error: {
          code: 'DUPLICATE_TICKET',
          message: `Duplicate ticket found: ${ticket.id}`,
          details: {
            duplicateTicketId: ticket.id,
          },
        },
      };
    }
    seenIds.add(ticket.id);
  }

  for (const ticket of tickets) {
    if ((ticket as { checkedIn?: boolean }).checkedIn) {
      return {
        success: false,
        error: {
          code: 'TICKET_ALREADY_CHECKED_IN',
          message: `Ticket ${ticket.id} has already been checked in and cannot join a group`,
          details: {
            checkedInTicketId: ticket.id,
          },
        },
      };
    }
  }

  const group: Group = {
    id: `GRP-${Date.now()}`,
    name: validName,
    tickets,
    createdAt: new Date().toISOString(),
    tier: validTier as 'Gold' | 'Silver' | 'Standard',
  };

  return {
    success: true,
    group,
  };
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const groups = JSON.parse(localStorage.getItem('arenaFlow_groups') || '[]') as Group[];
  return groups.find((g) => g.id === groupId) || null;
}

export async function saveGroup(group: Group): Promise<void> {
  const groups = JSON.parse(localStorage.getItem('arenaFlow_groups') || '[]') as Group[];
  const existingIndex = groups.findIndex((g) => g.id === group.id);
  if (existingIndex >= 0) {
    groups[existingIndex] = group;
  } else {
    groups.push(group);
  }
  localStorage.setItem('arenaFlow_groups', JSON.stringify(groups));
}
