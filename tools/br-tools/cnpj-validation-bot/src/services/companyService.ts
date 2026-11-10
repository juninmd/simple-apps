import companiesData from '../data/companies.json';

export interface Company {
  cnpj: string;
  company_name: string;
  trade_name?: string;
  status?: string;
}

export class CompanyService {
  private companies: Company[];

  constructor(customDataset?: Company[]) {
    this.companies = customDataset || (companiesData as Company[]);
  }

  /**
   * Search companies by partial name (company_name or trade_name), case-insensitive.
   * Paginated/limited to prevent unbounded query responses.
   */
  public searchByName(query: string, limit = 10, offset = 0): Company[] {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return [];
    }

    const filtered = this.companies.filter((company) => {
      const matchCompanyName = company.company_name
        .toLowerCase()
        .includes(trimmedQuery);
      const matchTradeName = company.trade_name
        ? company.trade_name.toLowerCase().includes(trimmedQuery)
        : false;

      return matchCompanyName || matchTradeName;
    });

    return filtered.slice(offset, offset + limit);
  }
}
