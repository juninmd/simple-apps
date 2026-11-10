import { CompanyService } from '../../services/companyService';

export class SearchCommand {
  private companyService: CompanyService;

  constructor(companyService?: CompanyService) {
    this.companyService = companyService || new CompanyService();
  }

  /**
   * Parses command input like `/search 'Tech'` or `/search Tech`
   * and returns query string.
   */
  public parseQuery(input: string): string {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/search')) {
      return '';
    }

    const args = trimmed.substring('/search'.length).trim();
    if (!args) {
      return '';
    }

    // Strip leading and trailing quotes if present (e.g. 'Tech' or "Tech")
    if (
      (args.startsWith("'") && args.endsWith("'")) ||
      (args.startsWith('"') && args.endsWith('"'))
    ) {
      return args.substring(1, args.length - 1).trim();
    }

    return args;
  }

  /**
   * Handles the `/search` command and returns formatted text response.
   */
  public execute(input: string): string {
    const query = this.parseQuery(input);

    if (!query) {
      return 'Usage: /search <company_name> (e.g. /search \'Tech\')';
    }

    const results = this.companyService.searchByName(query);

    if (results.length === 0) {
      return `No matching companies found for '${query}'.`;
    }

    const lines = results.map((c) => {
      const tradeStr = c.trade_name ? ` (${c.trade_name})` : '';
      return `- ${c.cnpj}: ${c.company_name}${tradeStr}`;
    });

    return `Found ${results.length} matching company(ies) for '${query}':\n` + lines.join('\n');
  }
}
