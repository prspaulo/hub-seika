export function toCentavos(reais: number): number {
  return Math.round(reais * 100);
}

export function fromCentavos(centavos: number): number {
  return centavos / 100;
}
