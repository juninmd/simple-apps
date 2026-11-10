import { SearchCommand } from '../src/bot/commands/search';
import { CompanyService } from '../src/services/companyService';

describe('SearchCommand', () => {
  const sampleData = [
    {
      cnpj: '12.345.678/0001-95',
      company_name: 'Tech Solutions LTDA',
      trade_name: 'TechSolutions',
    },
    {
      cnpj: '55.666.777/0001-88',
      company_name: 'Tech Services do Brasil EIRELI',
      trade_name: 'TechServices',
    },
  ];

  let command: SearchCommand;

  beforeEach(() => {
    const service = new CompanyService(sampleData);
    command = new SearchCommand(service);
  });

  describe('parseQuery', () => {
    it('should parse single quoted query', () => {
      expect(command.parseQuery("/search 'Tech'")).toBe('Tech');
    });

    it('should parse double quoted query', () => {
      expect(command.parseQuery('/search "Tech"')).toBe('Tech');
    });

    it('should parse unquoted query', () => {
      expect(command.parseQuery('/search Tech')).toBe('Tech');
    });

    it('should return empty string if no args provided', () => {
      expect(command.parseQuery('/search')).toBe('');
      expect(command.parseQuery('/search   ')).toBe('');
    });
  });

  describe('execute', () => {
    it('should return matched CNPJs when sending /search \'Tech\'', () => {
      const output = command.execute("/search 'Tech'");
      expect(output).toContain('Found 2 matching company(ies) for \'Tech\':');
      expect(output).toContain('12.345.678/0001-95');
      expect(output).toContain('55.666.777/0001-88');
    });

    it('should handle query with no matching results', () => {
      const output = command.execute("/search 'Unknown'");
      expect(output).toBe("No matching companies found for 'Unknown'.");
    });

    it('should return usage message when query is empty', () => {
      const output = command.execute('/search');
      expect(output).toContain('Usage: /search');
    });
  });
});
