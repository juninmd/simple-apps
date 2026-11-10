import { processBulkFile, extractCandidates, generateSummaryReport } from '../src/bulk';
import { handleDocumentUpload, handleTextMessage, isSupportedFileType } from '../src/bot';

describe('Bulk Processor & Bot File Handler', () => {
  describe('extractCandidates', () => {
    it('extracts CNPJs separated by newlines in .txt format', () => {
      const txtContent = `
00.000.000/0001-91
33.000.167/0001-01
00.000.000/0000-00
      `;
      const candidates = extractCandidates(txtContent);
      expect(candidates).toEqual([
        '00.000.000/0001-91',
        '33.000.167/0001-01',
        '00.000.000/0000-00',
      ]);
    });

    it('extracts CNPJs separated by commas, semicolons, or headers in .csv format', () => {
      const csvContent = `cnpj,status
"00.000.000/0001-91",ativo
33.000.167/0001-01;empresa2
06990590000123,empresa3`;

      const candidates = extractCandidates(csvContent);
      expect(candidates).toEqual([
        '00.000.000/0001-91',
        '33.000.167/0001-01',
        '06990590000123',
      ]);
    });
  });

  describe('processBulkFile', () => {
    it('correctly processes mixed valid and invalid CNPJs', () => {
      const content = `
00.000.000/0001-91
11.111.111/1111-11
33.000.167/0001-01
12345
      `;
      const result = processBulkFile(content, 'test_cnpjs.txt');

      expect(result.totalProcessed).toBe(4);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(2);
      expect(result.summaryReport).toContain('test_cnpjs.txt');
      expect(result.summaryReport).toContain('Total processado:* 4');
      expect(result.summaryReport).toContain('CNPJs Válidos:* 2');
      expect(result.summaryReport).toContain('CNPJs Inválidos:* 2');
      expect(result.summaryReport).toContain('Taxa de Validade:* 50.0%');
    });

    it('handles empty content gracefully', () => {
      const result = processBulkFile('', 'empty.txt');
      expect(result.totalProcessed).toBe(0);
      expect(result.validCount).toBe(0);
      expect(result.invalidCount).toBe(0);
      expect(result.summaryReport).toContain('Nenhum CNPJ encontrado');
    });

    it('accepts Buffer input', () => {
      const buffer = Buffer.from('00.000.000/0001-91\n06.990.590/0001-23');
      const result = processBulkFile(buffer, 'cnpjs.csv');
      expect(result.totalProcessed).toBe(2);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
    });
  });

  describe('isSupportedFileType', () => {
    it('validates file extension and mime type correctly', () => {
      expect(isSupportedFileType('list.txt')).toBe(true);
      expect(isSupportedFileType('data.csv')).toBe(true);
      expect(isSupportedFileType(undefined, 'text/plain')).toBe(true);
      expect(isSupportedFileType(undefined, 'text/csv')).toBe(true);
      expect(isSupportedFileType('image.png', 'image/png')).toBe(false);
      expect(isSupportedFileType('document.pdf')).toBe(false);
    });
  });

  describe('handleDocumentUpload', () => {
    it('returns error message for unsupported file types', () => {
      const response = handleDocumentUpload(
        { file_id: '123', file_name: 'doc.pdf' },
        'some content'
      );
      expect(response.success).toBe(false);
      expect(response.message).toContain('Formato de arquivo não suportado');
    });

    it('returns validation summary report for valid txt/csv uploads', () => {
      const content = '00.000.000/0001-91\n00000000000000';
      const response = handleDocumentUpload(
        { file_id: '456', file_name: 'cnpjs.txt', mime_type: 'text/plain' },
        content
      );
      expect(response.success).toBe(true);
      expect(response.summary?.totalProcessed).toBe(2);
      expect(response.summary?.validCount).toBe(1);
      expect(response.summary?.invalidCount).toBe(1);
      expect(response.message).toContain('Relatório de Validação em Lote');
    });
  });

  describe('handleTextMessage', () => {
    it('handles single CNPJ text inputs', () => {
      expect(handleTextMessage('00.000.000/0001-91')).toContain('VÁLIDO');
      expect(handleTextMessage('00000000000000')).toContain('INVÁLIDO');
      expect(handleTextMessage('')).toContain('Por favor, informe um CNPJ');
    });
  });
});
