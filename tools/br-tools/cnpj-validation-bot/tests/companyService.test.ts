import { CompanyService } from '../src/services/companyService';

describe('CompanyService', () => {
  const sampleData = [
    {
      cnpj: '12.345.678/0001-95',
      company_name: 'Tech Solutions LTDA',
      trade_name: 'TechSolutions',
    },
    {
      cnpj: '98.765.432/0001-10',
      company_name: 'Inovação e Tecnologia S.A.',
      trade_name: 'InovaTech',
    },
    {
      cnpj: '11.222.333/0001-44',
      company_name: 'Padaria Silva LTDA',
      trade_name: 'Padaria',
    },
  ];

  let service: CompanyService;

  beforeEach(() => {
    service = new CompanyService(sampleData);
  });

  it('should find companies matching query in company_name or trade_name case-insensitively', () => {
    const results = service.searchByName('tech');
    expect(results).toHaveLength(2);
    expect(results.map((c) => c.cnpj)).toEqual([
      '12.345.678/0001-95',
      '98.765.432/0001-10',
    ]);
  });

  it('should return empty array when query does not match', () => {
    const results = service.searchByName('NonExistent');
    expect(results).toHaveLength(0);
  });

  it('should return empty array for empty or whitespace query', () => {
    expect(service.searchByName('')).toHaveLength(0);
    expect(service.searchByName('   ')).toHaveLength(0);
  });

  it('should respect limit parameter', () => {
    const results = service.searchByName('tech', 1);
    expect(results).toHaveLength(1);
    expect(results[0].cnpj).toEqual('12.345.678/0001-95');
  });
});
