import { z } from 'zod';

export interface TicketScanResult {
  success: boolean;
  ticket?: {
    id: string;
    matchTitle: string;
    section: string;
    block: string;
    row: string;
    seat: string;
    tier: 'Gold' | 'Silver' | 'Standard';
    userName: string;
    qrCode: string;
    checkedIn?: boolean;
    checkedInAt?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: {
      rawGeminiResponse?: string;
      parseError?: string;
      extractedFields?: Partial<TicketScanResult>;
    };
  };
}

export const ScanImageSchema = z.object({
  imageBase64: z.string()
});

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Scans an uploaded base64 physical ticket utilizing Gemini generative vision algorithms.
 * Validates the image payload via Zod and unifies errors.
 * 
 * @param {string} imageBase64 - The encoded JPEG/PNG image buffer explicitly containing a physical ticket.
 * @returns {Promise<TicketScanResult>} The structured ticket output or normalized error bundle.
 */
export async function scanTicketImage(imageBase64: string): Promise<TicketScanResult> {
  if (!imageBase64 || imageBase64.trim() === '') {
    return {
      success: false,
      error: { code: 'MISSING_IMAGE', message: 'No image provided for scanning' }
    };
  }

  const validation = ScanImageSchema.safeParse({ imageBase64 });
  if (!validation.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: validation.error.format() }
    }
  }

  const { imageBase64: validBase64 } = validation.data;

  try {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: {
          code: 'GEMINI_API_ERROR',
          message: 'Gemini API key not configured',
        },
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Extract ticket information from this image. Return a JSON object with: matchTitle, section, block, row, seat, tier (Gold/Silver/Standard), userName, and qrCode. If not a valid ticket, return { "valid": false }.',
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: validBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'GEMINI_API_ERROR',
          message: `Gemini API returned ${response.status}`,
        },
      };
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      return {
        success: false,
        error: {
          code: 'GEMINI_API_ERROR',
          message: data.error.message || 'Gemini API error',
        },
      };
    }

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      return {
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message: 'Could not extract text from image',
        },
      };
    }

    let parsed;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(textContent);
      }
    } catch {
      return {
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message: 'Could not parse ticket data from response',
        },
      };
    }

    if (parsed.valid === false) {
      return {
        success: false,
        error: {
          code: 'INVALID_TICKET',
          message: 'Image does not contain a valid ticket',
        },
      };
    }

    if (!parsed.matchTitle || !parsed.qrCode) {
      return {
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message: 'Incomplete ticket data extracted',
        },
      };
    }

    return {
      success: true,
      ticket: {
        id: `TKT-${Date.now()}`,
        matchTitle: parsed.matchTitle,
        section: parsed.section || 'General',
        block: parsed.block || 'A',
        row: parsed.row || '1',
        seat: parsed.seat || '1',
        tier: ['Gold', 'Silver', 'Standard'].includes(parsed.tier)
          ? parsed.tier
          : 'Standard',
        userName: parsed.userName || 'Guest',
        qrCode: parsed.qrCode,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'GEMINI_API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}
