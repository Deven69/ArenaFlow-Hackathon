import { z } from 'zod';

export interface Barcode2FAResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Sanitizes a barcode input string to remove SQL injection characters or spaces.
 * @param {string} input - The raw barcode input entered by the user
 * @returns {string} The cleansed barcode input string
 */
export function sanitizeBarcodeInput(input: string): string {
  return input
    .replace(/['";\\-]/g, '')
    .replace(/\s+/g, '');
}

export const BarcodeValidationSchema = z.object({
  barcode: z.string(),
  userInput: z.string(),
});

/**
 * Verifies if the user-entered 4 digits match the last 4 digits of the original barcode.
 * Includes explicit Zod verification and error boundaries.
 * 
 * @param {string} barcode - The actual barcode value backing the ticket.
 * @param {string} userInput - The submitted input string from the user.
 * @returns {Barcode2FAResult} Returns a standardized result block.
 */
export function verifyBarcodeLast4(barcode: string, userInput: string): Barcode2FAResult {
  const parseResult = BarcodeValidationSchema.safeParse({ barcode, userInput });
  
  if (!parseResult.success) {
     return {
        success: false,
        error: {
           code: 'VALIDATION_ERROR',
           message: 'Invalid input format',
           details: parseResult.error.format()
        }
     };
  }

  const { userInput: validUser, barcode: validBarcode } = parseResult.data;
  const sanitizedInput = sanitizeBarcodeInput(validUser);

  if (!sanitizedInput || sanitizedInput.trim() === '') {
    return {
      success: false,
      error: { code: 'EMPTY_CODE', message: 'Please enter the last 4 digits of your barcode' },
    };
  }

  if (sanitizedInput.length !== 4) {
    return {
      success: false,
      error: { code: 'INVALID_CODE', message: 'Please enter exactly 4 digits' },
    };
  }

  if (!/^\d{4}$/.test(sanitizedInput)) {
    return {
      success: false,
      error: { code: 'INVALID_CODE', message: 'Code must be exactly 4 digits (0-9)' },
    };
  }

  const sanitizedBarcode = sanitizeBarcodeInput(validBarcode);
  const last4Digits = sanitizedBarcode.slice(-4);

  if (sanitizedInput === last4Digits) {
    return { success: true };
  }

  return {
    success: false,
    error: {
      code: 'VERIFICATION_FAILED',
      message: 'Incorrect barcode digits. Please check your ticket and try again.',
    },
  };
}

export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /UNION\s+SELECT/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /DROP\s+TABLE/i,
    /;\s*$/,
    /'/g,
    /"/g,
    /;/g,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Primary API entry route to verify a barcode securely checking against SQL injections beforehand.
 * 
 * @param {string} barcode - the actual ticket barcode
 * @param {string} userInput - The user's input string
 * @returns {Barcode2FAResult} Returns unified success/error block.
 */
export function verifyBarcodeWithSecurityCheck(
  barcode: string,
  userInput: string
): Barcode2FAResult {
  if (detectSQLInjection(userInput)) {
    return {
      success: false,
      error: {
        code: 'INVALID_CODE',
        message: 'Invalid input detected',
      },
    };
  }

  return verifyBarcodeLast4(barcode, userInput);
}
