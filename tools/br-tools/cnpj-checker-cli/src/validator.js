/**
 * Strips non-digit characters from a CNPJ string.
 * @param {string} cnpj
 * @returns {string}
 */
export function sanitizeCNPJ(cnpj) {
  if (typeof cnpj !== 'string') {
    return '';
  }
  return cnpj.replace(/\D/g, '');
}

/**
 * Validates a Brazilian CNPJ number using standard verification digit algorithms.
 * @param {string} cnpj
 * @returns {boolean}
 */
export function isValidCNPJ(cnpj) {
  const sanitized = sanitizeCNPJ(cnpj);

  // Must be exactly 14 digits
  if (sanitized.length !== 14) {
    return false;
  }

  // Reject sequence of identical digits (e.g. "00000000000000", "11111111111111")
  if (/^(\d)\1{13}$/.test(sanitized)) {
    return false;
  }

  // Verify 1st check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(sanitized[i], 10) * weights1[i];
  }
  const remainder1 = sum1 % 11;
  const expectedDigit1 = remainder1 < 2 ? 0 : 11 - remainder1;

  if (parseInt(sanitized[12], 10) !== expectedDigit1) {
    return false;
  }

  // Verify 2nd check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(sanitized[i], 10) * weights2[i];
  }
  const remainder2 = sum2 % 11;
  const expectedDigit2 = remainder2 < 2 ? 0 : 11 - remainder2;

  if (parseInt(sanitized[13], 10) !== expectedDigit2) {
    return false;
  }

  return true;
}

/**
 * Formats a 14-digit CNPJ string into standard XX.XXX.XXX/XXXX-XX format.
 * If the input is not a 14-digit CNPJ string (raw or sanitized), returns the input or empty string.
 * @param {string} cnpj
 * @returns {string}
 */
export function formatCNPJ(cnpj) {
  const sanitized = sanitizeCNPJ(cnpj);
  if (sanitized.length !== 14) {
    return typeof cnpj === 'string' ? cnpj : '';
  }
  return sanitized.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
