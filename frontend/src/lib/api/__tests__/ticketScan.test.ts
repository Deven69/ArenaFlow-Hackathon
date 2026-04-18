import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scanTicketImage } from "../ticketScan";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Ticket Scan API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, VITE_GEMINI_API_KEY: "test-api-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("valid image returns ticket object", () => {
    it("should return ticket object for valid ticket image", async () => {
      const validTicketResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    matchTitle: "IPL 2024: The Finale",
                    section: "Premium Lounge",
                    block: "B3",
                    row: "12",
                    seat: "18",
                    tier: "Gold",
                    userName: "Arjun Mehta",
                    qrCode: "ARENAFLOW-TKT-2024-FINALE-001",
                  }),
                },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validTicketResponse,
      });

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(true);
      expect(result.ticket).toBeDefined();
      expect(result.ticket?.matchTitle).toBe("IPL 2024: The Finale");
      expect(result.ticket?.section).toBe("Premium Lounge");
      expect(result.ticket?.tier).toBe("Gold");
      expect(result.ticket?.qrCode).toBe("ARENAFLOW-TKT-2024-FINALE-001");
    });

    it("should handle tier fallback for unknown tier", async () => {
      const invalidTierResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    matchTitle: "Test Match",
                    section: "General",
                    block: "A",
                    row: "1",
                    seat: "1",
                    tier: "Platinum",
                    userName: "Test User",
                    qrCode: "TEST-001",
                  }),
                },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidTierResponse,
      });

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(true);
      expect(result.ticket?.tier).toBe("Standard");
    });
  });

  describe("invalid image returns PARSE_FAILED error", () => {
    it("should return PARSE_FAILED when image does not contain valid ticket data", async () => {
      const invalidTicketResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({ valid: false }),
                },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidTicketResponse,
      });

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_TICKET");
    });

    it("should return PARSE_FAILED when extracted data is incomplete", async () => {
      const incompleteResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    matchTitle: "Test Match",
                  }),
                },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteResponse,
      });

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PARSE_FAILED");
    });

    it("should return PARSE_FAILED when response cannot be parsed as JSON", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "not valid json" }],
              },
            },
          ],
        }),
      });

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PARSE_FAILED");
    });
  });

  describe("missing image returns 400", () => {
    it("should return error when image is empty string", async () => {
      const result = await scanTicketImage("");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("MISSING_IMAGE");
      expect(result.error?.message).toBe("No image provided for scanning");
    });

    it("should return error when image is whitespace only", async () => {
      const result = await scanTicketImage("   ");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("MISSING_IMAGE");
    });

    it("should return error when image is undefined/null handling", async () => {
      const result = await scanTicketImage(undefined as unknown as string);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("MISSING_IMAGE");
    });
  });

  describe("Gemini API failure returns graceful error", () => {
    it("should return GEMINI_API_ERROR when API key is missing", async () => {
      process.env.VITE_GEMINI_API_KEY = undefined;

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("GEMINI_API_ERROR");
      expect(result.error?.message).toBe("Gemini API key not configured");
    });

    it("should return GEMINI_API_ERROR when fetch fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("GEMINI_API_ERROR");
      expect(result.error?.message).toBe("Network error");
    });

    it("should return GEMINI_API_ERROR when API returns non-ok status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("GEMINI_API_ERROR");
      expect(result.error?.message).toBe("Gemini API returned 429");
    });

    it("should return GEMINI_API_ERROR when API returns error in response body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: {
            message: "Rate limit exceeded",
            code: 429,
          },
        }),
      });

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("GEMINI_API_ERROR");
      expect(result.error?.message).toBe("Rate limit exceeded");
    });

    it("should handle missing candidates in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [],
        }),
      });

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PARSE_FAILED");
    });

    it("should handle empty text in response parts", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "" }],
              },
            },
          ],
        }),
      });

      const result = await scanTicketImage("base64image");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PARSE_FAILED");
    });
  });
});
