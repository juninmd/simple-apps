import { Receipt } from '../types/receipt';

export const POPULAR_STORES = [
  'Pão de Açúcar - Jardins',
  'Carrefour Bairro - Paulista',
  'Assaí Atacadista - Radial',
  'Supermercado Dia - Centro',
  'Atacadão - Barra Funda',
  'Mambo Supermercados - Moema',
  'St. Marche - Itaim',
  'Hirota Food Express - Pinheiros',
];

export const SAMPLE_PRODUCTS = [
  { base: 'Café Torrado e Moído Melitta 500g', price: 18.9 },
  { base: 'Leite Integral Parmalat 1L', price: 5.49 },
  { base: 'Arroz Branco Tipo 1 Camil 5kg', price: 29.9 },
  { base: 'Feijão Carioca Camil 1kg', price: 8.79 },
  { base: 'Azeite de Oliva Extra Virgem Gallo 500ml', price: 42.5 },
  { base: 'Açúcar Refinado União 1kg', price: 4.89 },
  { base: 'Óleo de Soja Liza 900ml', price: 6.75 },
  { base: 'Manteiga com Sal Aviação 200g', price: 14.9 },
  { base: 'Queijo Muçarela Fatiado 200g', price: 11.5 },
  { base: 'Pão de Forma Tradicional Wickbold 500g', price: 9.8 },
  { base: 'Ovos Brancos Grandes c/ 20 un', price: 16.9 },
  { base: 'Detergente Líquido Ypê Neutro 500ml', price: 2.69 },
  { base: 'Sabão em Pó OMO Lavagem Perfeita 1.6kg', price: 24.9 },
  { base: 'Amaciante Concentrado Downy 1L', price: 19.9 },
  { base: 'Creme Dental Colgate Total 12 90g', price: 7.49 },
  { base: 'Shampoo Seda Ceramidas 325ml', price: 12.9 },
  { base: 'Sabonete Dove Original 90g', price: 4.29 },
  { base: 'Papel Higiênico Neve Folha Dupla 12 rolos', price: 23.9 },
  { base: 'Refrigerante Coca-Cola Sem Açúcar 2L', price: 9.99 },
  { base: 'Cerveja Heineken Puro Malte 350ml', price: 5.89 },
];

/**
 * Generates a realistic mock dataset containing receipts and items.
 * Can generate either a compact dataset or the full 50 receipts / 200 unique items acceptance benchmark.
 */
export function generateMockReceipts(receiptCount = 50, uniqueItemCount = 200): Receipt[] {
  // Generate 200 unique grocery items
  const baseProducts = Array.from({ length: uniqueItemCount }, (_, i) => {
    if (i < SAMPLE_PRODUCTS.length) {
      return {
        id: i,
        name: SAMPLE_PRODUCTS[i].base,
        price: SAMPLE_PRODUCTS[i].price,
      };
    }
    const categories = ['Biscoito', 'Iogurte', 'Suco', 'Massa', 'Molho', 'Chocolate', 'Cereal', 'Sorvete', 'Água'];
    const brands = ['Nestlé', 'Danone', 'Bauducco', 'Barilla', 'Knorr', 'Lacta', 'Kellogg', 'Kibon', 'Crystal'];
    const cat = categories[i % categories.length];
    const brand = brands[Math.floor(i / categories.length) % brands.length];
    return {
      id: i,
      name: `${cat} ${brand} Especial Item #${i + 1}`,
      price: 4 + (i * 0.65) % 65,
    };
  });

  const receipts: Receipt[] = [];
  const now = new Date('2025-03-01T12:00:00Z');

  for (let r = 0; r < receiptCount; r++) {
    // Distribute receipts evenly across the previous 90 days
    const receiptDate = new Date(now.getTime() - (receiptCount - r) * 1.8 * 86400000);
    const dateStr = receiptDate.toISOString().split('T')[0];
    const store = POPULAR_STORES[r % POPULAR_STORES.length];

    // Each receipt has ~18-22 items
    const itemsCount = 20;
    const items = [];

    for (let k = 0; k < itemsCount; k++) {
      const prodIndex = (r * 11 + k * 19) % uniqueItemCount;
      const prod = baseProducts[prodIndex];

      // Introduce occasional real-world variations:
      // e.g. uppercase, missing accents, abbreviations
      let desc = prod.name;
      if (r % 3 === 0) {
        desc = desc.toUpperCase();
      } else if (r % 5 === 0) {
        desc = desc.replace(/Especial/gi, 'Esp.');
      } else if (r % 7 === 0) {
        desc = desc.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }

      // Small realistic price drift / fluctuation (+/- 15%)
      const priceDrift = ((r * 7 + k * 13) % 11 - 5) * 0.03 * prod.price;
      const unitPrice = Math.max(1.0, Number((prod.price + priceDrift).toFixed(2)));

      items.push({
        description: desc,
        quantity: 1 + (k % 4),
        unitPrice,
        totalPrice: Number((unitPrice * (1 + (k % 4))).toFixed(2)),
      });
    }

    receipts.push({
      id: `rcpt-${r + 1}`,
      store,
      date: dateStr,
      items,
    });
  }

  return receipts;
}
