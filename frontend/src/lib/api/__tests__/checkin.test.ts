import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock('@/lib/supabase', () => {
  const eqMock: any = vi.fn();
  eqMock.mockImplementation(() => ({
    eq: eqMock,
    single: vi.fn().mockResolvedValue({ data: { role: 'staff', owner_id: 'test-user-id' } })
  }));

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqMock
        })
      })
    }
  };
});

import {
  checkInGroup,
  checkInIndividualTicket,
  isGroupCheckedIn,
  isTicketIndividuallyCheckedIn,
} from "../checkin";
import type { Group } from "../group";
import type { Ticket } from "@/data/mockData";

const createMockTicket = (id: string, checkedIn = false): Ticket & {
  checkedIn?: boolean;
  checkedInAt?: string;
} => ({
  id,
  matchTitle: "IPL 2024: The Finale",
  teamA: "Mumbai Indians",
  teamB: "Chennai Super Kings",
  venue: "Narendra Modi Stadium",
  date: "2024-05-26",
  time: "19:30 IST",
  section: "Premium Lounge",
  block: "B3",
  row: "12",
  seat: "18",
  tier: "Gold",
  userName: "Test User",
  qrCode: `QR-${id}`,
  checkedIn,
});

describe("Check-in Group", () => {
  let mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    mockLocalStorage = {};
    vi.stubGlobal(
      "localStorage",
      {
        getItem: (key: string) => mockLocalStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockLocalStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockLocalStorage[key];
        },
      }
    );
  });

  describe("valid group QR checks in all members", () => {
    it("should successfully check in a valid group", async () => {
      const group: Group = {
        id: "GRP-001",
        name: "Test Group",
        tickets: [createMockTicket("TKT-001"), createMockTicket("TKT-002")],
        createdAt: new Date().toISOString(),
        tier: "Gold",
      };

      const result = await checkInGroup(group);

      expect(result.success).toBe(true);
      expect(result.checkedInTickets).toHaveLength(2);
      expect(result.checkedInTickets?.[0].ticketId).toBe("TKT-001");
      expect(result.checkedInTickets?.[1].ticketId).toBe("TKT-002");
    });

    it("should mark all tickets as checked in", async () => {
      const tickets = [createMockTicket("TKT-001"), createMockTicket("TKT-002")];
      const group: Group = {
        id: "GRP-001",
        name: "Test Group",
        tickets,
        createdAt: new Date().toISOString(),
        tier: "Gold",
      };

      await checkInGroup(group);

      expect(tickets[0].checkedIn).toBe(true);
      expect(tickets[1].checkedIn).toBe(true);
      expect(tickets[0].checkedInAt).toBeDefined();
      expect(tickets[1].checkedInAt).toBeDefined();
    });

    it("should store check-in in localStorage", async () => {
      const group: Group = {
        id: "GRP-001",
        name: "Test Group",
        tickets: [createMockTicket("TKT-001")],
        createdAt: new Date().toISOString(),
        tier: "Gold",
      };

      await checkInGroup(group);

      const checkIns = JSON.parse(mockLocalStorage["arenaFlow_checkins"] || "[]");
      expect(checkIns).toHaveLength(1);
      expect(checkIns[0].groupId).toBe("GRP-001");
      expect(checkIns[0].tickets).toContain("TKT-001");
    });

    it("should handle single-member group", async () => {
      const group: Group = {
        id: "GRP-001",
        name: "Solo Group",
        tickets: [createMockTicket("TKT-001")],
        createdAt: new Date().toISOString(),
        tier: "Gold",
      };

      const result = await checkInGroup(group);

      expect(result.success).toBe(true);
      expect(result.checkedInTickets).toHaveLength(1);
    });
  });

  describe("already checked-in group returns error", () => {
    it("should fail when group was already checked in", async () => {
      mockLocalStorage["arenaFlow_checkins"] = JSON.stringify([
        { groupId: "GRP-001", checkedInAt: "2024-05-26T10:00:00Z", tickets: ["TKT-001"] },
      ]);

      const group: Group = {
        id: "GRP-001",
        name: "Test Group",
        tickets: [createMockTicket("TKT-001")],
        createdAt: new Date().toISOString(),
        tier: "Gold",
      };

      const result = await checkInGroup(group);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("GROUP_ALREADY_CHECKED_IN");
      expect(result.error?.details?.alreadyCheckedInAt).toBe("2024-05-26T10:00:00Z");
    });

    it("should report check-in time", async () => {
      mockLocalStorage["arenaFlow_checkins"] = JSON.stringify([
        { groupId: "GRP-001", checkedInAt: "2024-05-26T10:30:00Z", tickets: ["TKT-001"] },
      ]);

      const group: Group = {
        id: "GRP-001",
        name: "Test Group",
        tickets: [createMockTicket("TKT-001")],
        createdAt: new Date().toISOString(),
        tier: "Gold",
      };

      const result = await checkInGroup(group);

      expect(result.error?.message).toContain("already checked in");
    });
  });

  describe("individual ticket already scanned before group scan", () => {
    it("should fail when ticket was scanned individually", async () => {
      mockLocalStorage["arenaFlow_individual_checkins"] = JSON.stringify({
        "TKT-002": { ticketId: "TKT-002", checkedInAt: "2024-05-26T09:00:00Z" },
      });

      const group: Group = {
        id: "GRP-001",
        name: "Test Group",
        tickets: [createMockTicket("TKT-001"), createMockTicket("TKT-002")],
        createdAt: new Date().toISOString(),
        tier: "Gold",
      };

      const result = await checkInGroup(group);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TICKET_ALREADY_SCANNED");
      expect(result.error?.details?.conflictedTicketId).toBe("TKT-002");
    });

    it("should report which ticket conflicted", async () => {
      mockLocalStorage["arenaFlow_individual_checkins"] = JSON.stringify({
        "TKT-003": { ticketId: "TKT-003", checkedInAt: "2024-05-26T09:00:00Z" },
      });

      const group: Group = {
        id: "GRP-001",
        name: "Test Group",
        tickets: [
          createMockTicket("TKT-001"),
          createMockTicket("TKT-002"),
          createMockTicket("TKT-003"),
        ],
        createdAt: new Date().toISOString(),
        tier: "Gold",
      };

      const result = await checkInGroup(group);

      expect(result.error?.details?.conflictedTicketId).toBe("TKT-003");
      expect(result.error?.message).toContain("TKT-003");
    });

    it("should block group check-in for any individually scanned ticket", async () => {
      mockLocalStorage["arenaFlow_individual_checkins"] = JSON.stringify({
        "TKT-001": { ticketId: "TKT-001", checkedInAt: "2024-05-26T09:00:00Z" },
        "TKT-002": { ticketId: "TKT-002", checkedInAt: "2024-05-26T09:30:00Z" },
      });

      const group: Group = {
        id: "GRP-001",
        name: "Test Group",
        tickets: [createMockTicket("TKT-001"), createMockTicket("TKT-002")],
        createdAt: new Date().toISOString(),
        tier: "Gold",
      };

      const result = await checkInGroup(group);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TICKET_ALREADY_SCANNED");
    });

    it("should report check-in time of conflicted ticket", async () => {
      mockLocalStorage["arenaFlow_individual_checkins"] = JSON.stringify({
        "TKT-002": { ticketId: "TKT-002", checkedInAt: "2024-05-26T08:45:00Z" },
      });

      const group: Group = {
        id: "GRP-001",
        name: "Test Group",
        tickets: [createMockTicket("TKT-001"), createMockTicket("TKT-002")],
        createdAt: new Date().toISOString(),
        tier: "Gold",
      };

      const result = await checkInGroup(group);

      expect(result.error?.details?.alreadyCheckedInAt).toBe("2024-05-26T08:45:00Z");
    });
  });

  describe("isGroupCheckedIn helper", () => {
    it("should return true for checked-in group", () => {
      mockLocalStorage["arenaFlow_checkins"] = JSON.stringify([
        { groupId: "GRP-001", checkedInAt: "2024-05-26T10:00:00Z", tickets: [] },
      ]);

      expect(isGroupCheckedIn("GRP-001")).toBe(true);
    });

    it("should return false for unchecked group", () => {
      mockLocalStorage["arenaFlow_checkins"] = JSON.stringify([
        { groupId: "GRP-001", checkedInAt: "2024-05-26T10:00:00Z", tickets: [] },
      ]);

      expect(isGroupCheckedIn("GRP-002")).toBe(false);
    });
  });

  describe("individual ticket check-in", () => {
    it("should successfully check in individual ticket", async () => {
      const ticket = createMockTicket("TKT-001");

      const result = await checkInIndividualTicket(ticket);

      expect(result.success).toBe(true);
      expect(ticket.checkedIn).toBe(true);
    });

    it("should fail for already checked-in ticket", async () => {
      const ticket = { ...createMockTicket("TKT-001"), checkedIn: true };

      const result = await checkInIndividualTicket(ticket);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TICKET_ALREADY_SCANNED");
    });

    it("should store individual check-in separately", async () => {
      const ticket = createMockTicket("TKT-001");

      await checkInIndividualTicket(ticket);

      const checkIns = JSON.parse(
        mockLocalStorage["arenaFlow_individual_checkins"] || "{}"
      );
      expect(checkIns["TKT-001"]).toBeDefined();
      expect(checkIns["TKT-001"].ticketId).toBe("TKT-001");
    });
  });

  describe("isTicketIndividuallyCheckedIn helper", () => {
    it("should return true for individually checked-in ticket", () => {
      mockLocalStorage["arenaFlow_individual_checkins"] = JSON.stringify({
        "TKT-001": { ticketId: "TKT-001", checkedInAt: "2024-05-26T10:00:00Z" },
      });

      expect(isTicketIndividuallyCheckedIn("TKT-001")).toBe(true);
    });

    it("should return false for unchecked ticket", () => {
      mockLocalStorage["arenaFlow_individual_checkins"] = JSON.stringify({});

      expect(isTicketIndividuallyCheckedIn("TKT-001")).toBe(false);
    });
  });
});
