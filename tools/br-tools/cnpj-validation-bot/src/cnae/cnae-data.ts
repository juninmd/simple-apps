/**
 * CNAE code to industry description mapping dataset.
 * Canonical keys are stored as 7-digit string representations (without separators).
 */
export const CNAE_DATASET: Record<string, string> = {
  // Information Technology & Software Development
  '6201500': 'Development of customizable software',
  '6202300': 'Development and licensing of non-customizable computer programs',
  '6203100': 'Computer software consultancy and technical support',
  '6204000': 'Consulting in computer technology',
  '6209100': 'Support services for information technology not elsewhere classified',
  '6311900': 'Data processing, web hosting and related activities',
  '6319400': 'Web portals, content search engines and other information services on the internet',

  // Retail & Commerce
  '4711301': 'Hypermarkets hypermarkets trade',
  '4711302': 'Supermarkets retail trade',
  '4712100': 'Grocery stores and minimarkets',
  '4751201': 'Retail trade of specialized computer equipment and software',

  // Services & Consultancy
  '7020400': 'Management consultancy activities',
  '7311400': 'Advertising agencies',
  '7319002': 'Promotional and marketing distribution services',

  // Education & Training
  '8599603': 'Training in professional and managerial development',
  '8599604': 'Technical and professional courses',

  // Food & Beverage
  '5611201': 'Restaurants and similar food services',
  '5611203': 'Lanches, fast food and juice bars'
};
