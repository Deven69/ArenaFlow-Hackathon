import { describe, it, expect } from "vitest";
import {
  verifyBarcodeLast4,
  sanitizeBarcodeInput,
  detectSQLInjection,
  verifyBarcodeWithSecurityCheck,
} from "../barcode2FA";

describe("Barcode 2FA Verification", () => {
  describe("correct last 4 digits passes", () => {
    it("should pass when last 4 digits match", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "3456");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should pass for numeric-only barcode", () => {
      const barcode = "12345678901234";
      const result = verifyBarcodeLast4(barcode, "1234");

      expect(result.success).toBe(true);
    });

    it("should be case insensitive for alphabetic barcodes", () => {
      const barcode = "ABC-DEF-1234";
      const result = verifyBarcodeLast4(barcode, "1234");

      expect(result.success).toBe(true);
    });

    it("should handle barcode with exactly 4 characters", () => {
      const barcode = "1234";
      const result = verifyBarcodeLast4(barcode, "1234");

      expect(result.success).toBe(true);
    });

    it("should handle barcode with special characters before digits", () => {
      const barcode = "TKT_2024_5678";
      const result = verifyBarcodeLast4(barcode, "5678");

      expect(result.success).toBe(true);
    });
  });

  describe("wrong digits fails", () => {
    it("should fail when last 4 digits do not match", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "9999");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("VERIFICATION_FAILED");
    });

    it("should fail for off-by-one digits", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "3455");

      expect(result.success).toBe(false);
    });

    it("should fail for reversed digits", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "6543");

      expect(result.success).toBe(false);
    });

    it("should return appropriate error message", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "1111");

      expect(result.error?.message).toContain("Incorrect barcode");
      expect(result.error?.message).toContain("try again");
    });
  });

  describe("empty string fails", () => {
    it("should fail when input is empty string", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("EMPTY_CODE");
    });

    it("should fail when input is whitespace only", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "   ");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("EMPTY_CODE");
    });

    it("should return specific message for empty input", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "");

      expect(result.error?.message).toBe("Please enter the last 4 digits of your barcode");
    });
  });

  describe("invalid input handling", () => {
    it("should fail for less than 4 digits", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "123");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_CODE");
    });

    it("should fail for more than 4 digits", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "12345");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_CODE");
    });

    it("should fail for non-numeric input", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "abcd");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_CODE");
    });

    it("should fail for mixed alphanumeric", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "12ab");

      expect(result.success).toBe(false);
    });

    it("should return specific message for non-numeric input", () => {
      const barcode = "ARENAFLOWTKT202400123456";
      const result = verifyBarcodeLast4(barcode, "abcd");

      expect(result.error?.message).toBe("Code must be exactly 4 digits (0-9)");
    });
  });

  describe("SQL injection attempt in barcode field is sanitized", () => {
    it("should detect single quote injection attempt", () => {
      const isInjection = detectSQLInjection("' OR '1'='1");
      expect(isInjection).toBe(true);
    });

    it("should detect semicolon injection", () => {
      const isInjection = detectSQLInjection("; DROP TABLE users;");
      expect(isInjection).toBe(true);
    });

    it("should detect UNION injection", () => {
      const isInjection = detectSQLInjection("' UNION SELECT * FROM passwords --");
      expect(isInjection).toBe(true);
    });

    it("should detect DROP TABLE injection", () => {
      const isInjection = detectSQLInjection("'; DROP TABLE tickets; --");
      expect(isInjection).toBe(true);
    });

    it("should sanitize input by removing special characters", () => {
      const sanitized = sanitizeBarcodeInput("'; DELETE FROM tickets; --");
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain(";");
    });

    it("should strip hyphens in sanitize", () => {
      const sanitized = sanitizeBarcodeInput("12-34");
      expect(sanitized).toBe("1234");
    });

    it("should preserve full barcode length", () => {
      const longInput = "123456789012345678901234567890";
      const sanitized = sanitizeBarcodeInput(longInput);
      expect(sanitized).toBe(longInput);
    });

    it("should remove whitespace", () => {
      const sanitized = sanitizeBarcodeInput("1 2 3 4");
      expect(sanitized).toBe("1234");
    });

    it("should fail verification when injection detected via security check", () => {
      const barcode = "ARENAFLOW-TKT-2024-00123456";
      const result = verifyBarcodeWithSecurityCheck(barcode, "'; DROP TABLE --");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_CODE");
    });

    it("should allow valid numeric input after sanitization", () => {
      const isInjection = detectSQLInjection("1234");
      expect(isInjection).toBe(false);
    });

    it("should pass for barcode containing SQL keywords in normal text", () => {
      const barcode = "SELECT_TKT_2024_12345678";
      const result = verifyBarcodeLast4(barcode, "5678");

      expect(result.success).toBe(true);
    });
  });
});
