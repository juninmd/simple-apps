import { cleanCNPJ, formatCNPJ, isValidCNPJ } from './cnpj';

export interface CNPJValidationResult {
  raw: string;
  formatted: string;
  isValid: boolean;
}

export interface BulkSummary {
  totalProcessed: number;
  validCount: number;
  invalidCount: number;
  results: CNPJValidationResult[];
  summaryReport: string;
}

/**
 * Extracts candidate tokens from text or CSV content.
 */
export function extractCandidates(content: string): string[] {
  // Split by newlines
  const lines = content.split(/[\r\n]+/);
  const candidates: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Split line by common CSV delimiters: comma, semicolon, tab, pipe
    const tokens = trimmedLine.split(/[,;\t|]/);

    for (let token of tokens) {
      token = token.trim().replace(/^["']|["']$/g, ''); // strip outer quotes
      if (!token) continue;

      // Ignore common header names or tokens containing letters (e.g. column names or text descriptions)
      if (/[a-zA-Z]/.test(token)) {
        continue;
      }

      // Check if token contains at least one digit
      if (/\d/.test(token)) {
        candidates.push(token);
      }
    }
  }

  return candidates;
}

/**
 * Processes bulk text or CSV content and returns a summary report.
 */
export function processBulkFile(content: string | Buffer, filename?: string): BulkSummary {
  const textContent = typeof content === 'string' ? content : content.toString('utf-8');
  const candidates = extractCandidates(textContent);

  const results: CNPJValidationResult[] = candidates.map((raw) => {
    const valid = isValidCNPJ(raw);
    const cleaned = cleanCNPJ(raw);
    return {
      raw,
      formatted: valid ? formatCNPJ(cleaned) : raw,
      isValid: valid,
    };
  });

  const totalProcessed = results.length;
  const validCount = results.filter((r) => r.isValid).length;
  const invalidCount = totalProcessed - validCount;

  const summaryReport = generateSummaryReport({
    filename,
    totalProcessed,
    validCount,
    invalidCount,
    results,
  });

  return {
    totalProcessed,
    validCount,
    invalidCount,
    results,
    summaryReport,
  };
}

interface GenerateReportOptions {
  filename?: string;
  totalProcessed: number;
  validCount: number;
  invalidCount: number;
  results: CNPJValidationResult[];
}

/**
 * Generates a human-readable summary report string for Telegram or CLI output.
 */
export function generateSummaryReport(options: GenerateReportOptions): string {
  const { filename, totalProcessed, validCount, invalidCount, results } = options;

  let report = '📊 *Relatório de Validação em Lote*\n';
  if (filename) {
    report += `📁 *Arquivo:* ${filename}\n`;
  }
  report += `───────────────\n`;
  report += `🔢 *Total processado:* ${totalProcessed}\n`;
  report += `✅ *CNPJs Válidos:* ${validCount}\n`;
  report += `❌ *CNPJs Inválidos:* ${invalidCount}\n`;

  if (totalProcessed === 0) {
    report += `\nNenhum CNPJ encontrado no arquivo fornecido.`;
    return report;
  }

  const successRate = ((validCount / totalProcessed) * 100).toFixed(1);
  report += `📈 *Taxa de Validade:* ${successRate}%\n`;

  const invalidItems = results.filter((r) => !r.isValid);
  if (invalidItems.length > 0) {
    report += `\n❌ *Lista de CNPJs Inválidos:*\n`;
    const maxDisplay = 10;
    invalidItems.slice(0, maxDisplay).forEach((item) => {
      report += ` • \`${item.raw}\`\n`;
    });

    if (invalidItems.length > maxDisplay) {
      report += `... e mais ${invalidItems.length - maxDisplay} inválido(s).\n`;
    }
  }

  return report;
}
