/**
 * Removes non-numeric characters from a CNPJ string.
 */
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Validates whether a given string is a valid Brazilian CNPJ.
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj || typeof cnpj !== 'string') {
    return false;
  }

  const cleaned = cleanCNPJ(cnpj);

  // CNPJ must be exactly 14 digits
  if (cleaned.length !== 14) {
    return false;
  }

  // Reject sequence of identical digits
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return false;
  }

  // Validate 1st verification digit
  const weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sumFirst = 0;
  for (let i = 0; i < 12; i++) {
    sumFirst += parseInt(cleaned[i], 10) * weightsFirst[i];
  }
  const remainderFirst = sumFirst % 11;
  const expectedFirstDigit = remainderFirst < 2 ? 0 : 11 - remainderFirst;

  if (parseInt(cleaned[12], 10) !== expectedFirstDigit) {
    return false;
  }

  // Validate 2nd verification digit
  const weightsSecond = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sumSecond = 0;
  for (let i = 0; i < 13; i++) {
    sumSecond += parseInt(cleaned[i], 10) * weightsSecond[i];
  }
  const remainderSecond = sumSecond % 11;
  const expectedSecondDigit = remainderSecond < 2 ? 0 : 11 - remainderSecond;

  if (parseInt(cleaned[13], 10) !== expectedSecondDigit) {
    return false;
  }

  return true;
}

/**
 * Formats a 14-digit CNPJ into XX.XXX.XXX/XXXX-XX.
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanCNPJ(cnpj);
  if (cleaned.length !== 14) {
    return cnpj;
  }
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}
