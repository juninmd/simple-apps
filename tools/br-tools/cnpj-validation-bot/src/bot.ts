import { processBulkFile, BulkSummary } from './bulk';
import { isValidCNPJ, formatCNPJ, cleanCNPJ } from './cnpj';

export interface TelegramDocument {
  file_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface DocumentHandlerResponse {
  success: boolean;
  message: string;
  summary?: BulkSummary;
}

/**
 * Checks if a file extension or MIME type is acceptable (.txt or .csv).
 */
export function isSupportedFileType(filename?: string, mimeType?: string): boolean {
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'txt' || ext === 'csv') {
      return true;
    }
  }

  if (mimeType) {
    const lowerMime = mimeType.toLowerCase();
    if (
      lowerMime === 'text/plain' ||
      lowerMime === 'text/csv' ||
      lowerMime === 'application/csv' ||
      lowerMime === 'application/vnd.ms-excel'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Handles incoming document upload for bulk CNPJ validation.
 */
export function handleDocumentUpload(
  document: TelegramDocument,
  fileContent: string | Buffer
): DocumentHandlerResponse {
  const filename = document.file_name || 'documento.txt';

  if (!isSupportedFileType(filename, document.mime_type)) {
    return {
      success: false,
      message: '⚠️ Formato de arquivo não suportado. Envie um arquivo .txt ou .csv com os CNPJs para validação em lote.',
    };
  }

  const summary = processBulkFile(fileContent, filename);

  return {
    success: true,
    message: summary.summaryReport,
    summary,
  };
}

/**
 * Main entry point for single or bulk CNPJ query.
 */
export function handleTextMessage(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return 'Por favor, informe um CNPJ para consulta ou envie um arquivo .txt/.csv para validação em lote.';
  }

  const cleaned = cleanCNPJ(trimmed);
  if (cleaned.length === 14) {
    if (isValidCNPJ(cleaned)) {
      return `✅ CNPJ ${formatCNPJ(cleaned)} é *VÁLIDO*!`;
    } else {
      return `❌ CNPJ ${trimmed} é *INVÁLIDO*!`;
    }
  }

  return 'CNPJ inválido. Certifique-se de digitar 14 dígitos ou enviar um arquivo .txt ou .csv para validação em lote.';
}
