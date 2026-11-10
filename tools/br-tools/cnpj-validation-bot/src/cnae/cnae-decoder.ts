import { CNAE_DATASET } from './cnae-data.js';

export interface CnaeInfo {
  code: string;
  formattedCode: string;
  description: string;
}

export interface CnaeDecodeOptions {
  /**
   * Custom dataset mapping 7-digit numeric CNAE codes to descriptions.
   */
  customDataset?: Record<string, string>;
  /**
   * Fallback description if the code is valid but not found in dataset.
   */
  fallbackDescription?: string;
}

/**
 * Normalizes a CNAE input into a string containing only digits.
 *
 * @param code Raw CNAE code as string or number
 * @returns Clean numeric string or empty string if input is nullish/invalid
 */
export function normalizeCnae(code: string | number | null | undefined): string {
  if (code === null || code === undefined) {
    return '';
  }

  const str = typeof code === 'number' ? code.toString() : String(code);
  return str.replace(/\D/g, '');
}

/**
 * Validates whether a CNAE code represents a valid 7-digit CNAE structure.
 *
 * @param code CNAE code to validate
 * @returns True if valid 7-digit CNAE code
 */
export function isValidCnae(code: string | number | null | undefined): boolean {
  const digits = normalizeCnae(code);
  return digits.length === 7;
}

/**
 * Formats a CNAE code into standard 'XXXX-X/XX' display format.
 *
 * @param code CNAE code to format
 * @returns Formatted CNAE string (e.g. '6201-5/00') or null if invalid
 */
export function formatCnae(code: string | number | null | undefined): string | null {
  const digits = normalizeCnae(code);
  if (digits.length !== 7) {
    return null;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5, 7)}`;
}

/**
 * Decodes a numeric or formatted CNAE code into its industry description.
 *
 * @param code CNAE code (e.g. '6201-5/00', '6201500', or 6201500)
 * @param options Decode options including custom dataset or fallback
 * @returns Industry description or null if not found
 */
export function decodeCnae(
  code: string | number | null | undefined,
  options?: CnaeDecodeOptions
): string | null {
  const digits = normalizeCnae(code);
  if (digits.length !== 7) {
    return null;
  }

  const dataset = options?.customDataset ?? CNAE_DATASET;
  const description = dataset[digits];

  if (description) {
    return description;
  }

  return options?.fallbackDescription ?? null;
}

/**
 * Object-oriented CnaeDecoder class for stateful lookup or dependency injection.
 */
export class CnaeDecoder {
  private dataset: Record<string, string>;

  constructor(dataset: Record<string, string> = CNAE_DATASET) {
    this.dataset = { ...dataset };
  }

  /**
   * Registers or updates a CNAE code mapping.
   */
  public register(code: string | number, description: string): void {
    const digits = normalizeCnae(code);
    if (digits.length === 7) {
      this.dataset[digits] = description;
    }
  }

  /**
   * Decodes a CNAE code using this decoder's dataset.
   */
  public decode(code: string | number | null | undefined): string | null {
    return decodeCnae(code, { customDataset: this.dataset });
  }

  /**
   * Retrieves full info object including canonical code, formatted code, and description.
   */
  public getInfo(code: string | number | null | undefined): CnaeInfo | null {
    const digits = normalizeCnae(code);
    const description = this.decode(digits);

    if (!description) {
      return null;
    }

    const formattedCode = formatCnae(digits) ?? digits;
    return {
      code: digits,
      formattedCode,
      description
    };
  }
}
