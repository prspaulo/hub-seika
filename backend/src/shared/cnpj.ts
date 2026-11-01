export function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

function calcCheckDigit(digits: string, weights: number[]): number {
  const sum = digits
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

const FIRST_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const SECOND_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function isValidCnpj(rawCnpj: string): boolean {
  const cnpj = normalizeCnpj(rawCnpj);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // todos os dígitos iguais

  const base = cnpj.slice(0, 12);
  const firstDigit = calcCheckDigit(base, FIRST_WEIGHTS);
  const secondDigit = calcCheckDigit(base + firstDigit, SECOND_WEIGHTS);

  return cnpj === base + firstDigit + secondDigit;
}
