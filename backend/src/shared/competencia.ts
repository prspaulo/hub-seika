// "Competência" no formato YYYY-MM, igual ao sistema antigo.
export function competenciaAtual(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function vencimentoDaCompetencia(competencia: string, diaVencimento: number): Date {
  const dia = Math.min(28, diaVencimento || 10);
  return new Date(`${competencia}-${String(dia).padStart(2, "0")}T00:00:00.000Z`);
}

export function chaveMensal(empresaId: string, competencia: string): string {
  return `monthly:${empresaId}:${competencia}`;
}
