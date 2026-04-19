import { describe, it, expect, vi } from "vitest";

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

import { createGroup, TIER_LIMITS } from "../group";
import type { Ticket } from "@/data/mockData";

describe("Group Creation", () => {
  const createMockTicket = (
    id: string,
    overrides: Partial<Ticket> = {}
  ): Ticket => ({
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
    ...overrides,
  });

  describe("valid group creates correctly", () => {
    it("should create a Gold tier group successfully", async () => {
      const tickets = [createMockTicket("TKT-001")];

      const result = await createGroup("My Gold Group", tickets, "Gold");

      expect(result.success).toBe(true);
      expect(result.group).toBeDefined();
      expect(result.group?.name).toBe("My Gold Group");
      expect(result.group?.tier).toBe("Gold");
      expect(result.group?.tickets).toHaveLength(1);
      expect(result.group?.tickets[0].id).toBe("TKT-001");
    });

    it("should create a Silver tier group successfully", async () => {
      const tickets = [
        createMockTicket("TKT-001", { tier: "Silver" }),
        createMockTicket("TKT-002", { tier: "Silver" }),
      ];

      const result = await createGroup("My Silver Group", tickets, "Silver");

      expect(result.success).toBe(true);
      expect(result.group?.tier).toBe("Silver");
      expect(result.group?.tickets).toHaveLength(2);
    });

    it("should create a Standard tier group successfully", async () => {
      const tickets = [
        createMockTicket("TKT-001", { tier: "Standard" }),
        createMockTicket("TKT-002", { tier: "Standard" }),
        createMockTicket("TKT-003", { tier: "Standard" }),
      ];

      const result = await createGroup("My Standard Group", tickets, "Standard");

      expect(result.success).toBe(true);
      expect(result.group?.tier).toBe("Standard");
    });

    it("should generate a unique group ID", async () => {
      const result = await createGroup("Test Group", [createMockTicket("TKT-001")], "Gold");

      expect(result.group?.id).toMatch(/^GRP-/);
      expect(result.group?.id.length).toBeGreaterThan(4);
    });

    it("should set creation timestamp", async () => {
      const before = Date.now();
      const result = await createGroup("Test Group", [createMockTicket("TKT-001")], "Gold");
      const after = Date.now();

      expect(result.group?.createdAt).toBeDefined();
      const createdAtTime = new Date(result.group?.createdAt || "").getTime();
      expect(createdAtTime).toBeGreaterThanOrEqual(before - 1000);
      expect(createdAtTime).toBeLessThanOrEqual(after + 1000);
    });
  });

  describe("group exceeds tier cap", () => {
    it("should fail when Standard tier exceeds 8 members", async () => {
      const tickets = Array.from({ length: 9 }, (_, i) =>
        createMockTicket(`TKT-${String(i + 1).padStart(3, "0")}`, { tier: "Standard" })
      );

      const result = await createGroup("Too Large", tickets, "Standard");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TIER_CAP_EXCEEDED");
      expect(result.error?.message).toContain("8");
      expect(result.error?.details?.maxAllowed).toBe(8);
      expect(result.error?.details?.requested).toBe(9);
    });

    it("should fail when Silver tier exceeds 15 members", async () => {
      const tickets = Array.from({ length: 16 }, (_, i) =>
        createMockTicket(`TKT-${String(i + 1).padStart(3, "0")}`, { tier: "Silver" })
      );

      const result = await createGroup("Too Large", tickets, "Silver");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TIER_CAP_EXCEEDED");
      expect(result.error?.details?.maxAllowed).toBe(15);
      expect(result.error?.details?.requested).toBe(16);
    });

    it("should fail when Gold tier exceeds 15 members", async () => {
      const tickets = Array.from({ length: 20 }, (_, i) =>
        createMockTicket(`TKT-${String(i + 1).padStart(3, "0")}`, { tier: "Gold" })
      );

      const result = await createGroup("Too Large", tickets, "Gold");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TIER_CAP_EXCEEDED");
      expect(result.error?.details?.maxAllowed).toBe(15);
    });

    it("should allow exactly at the cap limit", async () => {
      const tickets = Array.from({ length: 8 }, (_, i) =>
        createMockTicket(`TKT-${String(i + 1).padStart(3, "0")}`, { tier: "Standard" })
      );

      const result = await createGroup("Max Size", tickets, "Standard");

      expect(result.success).toBe(true);
      expect(result.group?.tickets).toHaveLength(8);
    });

    it("should have correct tier limits defined", () => {
      expect(TIER_LIMITS.Standard).toBe(8);
      expect(TIER_LIMITS.Silver).toBe(15);
      expect(TIER_LIMITS.Gold).toBe(15);
    });
  });

  describe("duplicate ticket in group", () => {
    it("should fail when same ticket ID appears twice", async () => {
      const tickets = [
        createMockTicket("TKT-001"),
        createMockTicket("TKT-001"),
      ];

      const result = await createGroup("Duplicate Group", tickets, "Gold");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("DUPLICATE_TICKET");
      expect(result.error?.details?.duplicateTicketId).toBe("TKT-001");
    });

    it("should fail when duplicate appears anywhere in the list", async () => {
      const tickets = [
        createMockTicket("TKT-001"),
        createMockTicket("TKT-002"),
        createMockTicket("TKT-003"),
        createMockTicket("TKT-002"),
      ];

      const result = await createGroup("Duplicate Group", tickets, "Gold");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("DUPLICATE_TICKET");
      expect(result.error?.details?.duplicateTicketId).toBe("TKT-002");
    });

    it("should succeed when all tickets are unique", async () => {
      const tickets = [
        createMockTicket("TKT-001"),
        createMockTicket("TKT-002"),
        createMockTicket("TKT-003"),
      ];

      const result = await createGroup("Unique Group", tickets, "Gold");

      expect(result.success).toBe(true);
    });
  });

  describe("already-checked-in ticket cannot join group", () => {
    it("should fail when ticket is already checked in", async () => {
      const tickets = [
        createMockTicket("TKT-001"),
        { ...createMockTicket("TKT-002"), checkedIn: true },
      ];

      const result = await createGroup("Checked In Group", tickets, "Gold");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TICKET_ALREADY_CHECKED_IN");
      expect(result.error?.details?.checkedInTicketId).toBe("TKT-002");
    });

    it("should check all tickets in the group", async () => {
      const tickets = [
        createMockTicket("TKT-001"),
        createMockTicket("TKT-002"),
        { ...createMockTicket("TKT-003"), checkedIn: true },
        createMockTicket("TKT-004"),
      ];

      const result = await createGroup("Mixed Group", tickets, "Gold");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TICKET_ALREADY_CHECKED_IN");
    });

    it("should succeed when no tickets are checked in", async () => {
      const tickets = [
        { ...createMockTicket("TKT-001"), checkedIn: false },
        { ...createMockTicket("TKT-002"), checkedIn: false },
      ];

      const result = await createGroup("Clean Group", tickets, "Gold");

      expect(result.success).toBe(true);
    });

    it("should report the first checked-in ticket found", async () => {
      const tickets = [
        createMockTicket("TKT-001"),
        { ...createMockTicket("TKT-002"), checkedIn: true },
        { ...createMockTicket("TKT-003"), checkedIn: true },
      ];

      const result = await createGroup("Group", tickets, "Gold");

      expect(result.error?.details?.checkedInTicketId).toBe("TKT-002");
    });
  });
});
