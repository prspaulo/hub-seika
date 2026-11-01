export type Ato = "Constituição" | "Alteração" | "Distrato";

export type MinutaInput = {
  act: Ato;
  ordinal: number;
  name: string;
  cnpj: string;
  nire: string;
  address: string;
  size: "Sem enquadramento" | "ME" | "EPP";
  city: string;
  partners: string;
  object: string;
  capital: number;
  quotaValue: number;
  distribution: string;
  admins: string;
  start: string;
  signatureDate: string;
  changes: string;
  consolidation: string;
  extra: string;
};

function formatDateBr(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatBrl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Porta fiel de `contractForm`/`draftTitle` do sistema antigo (index.html).
// Gera um RASCUNHO — sempre precisa de revisão técnica antes de qualquer uso.
export function buildMinuta(d: MinutaInput): { title: string; text: string } {
  if (d.act !== "Constituição" && (!d.cnpj || !d.nire || !d.changes.trim())) {
    throw new Error("Para alteração/distrato, preencha CNPJ, NIRE e as cláusulas específicas.");
  }
  if (Math.abs(d.capital / d.quotaValue - Math.round(d.capital / d.quotaValue)) > 1e-6) {
    throw new Error("Capital deve ser divisível pelo valor de cada quota.");
  }

  const title =
    d.act === "Constituição"
      ? "CONTRATO SOCIAL DE " + d.name
      : d.act === "Alteração"
        ? d.ordinal + "ª ALTERAÇÃO CONTRATUAL DE " + d.name
        : "DISTRATO SOCIAL DE " + d.name;

  let base = `${title}\n\nMINUTA PARA REVISÃO TÉCNICA\n\n${d.partners}\n\n${
    d.act === "Constituição"
      ? "Resolvem constituir uma sociedade empresária limitada mediante as cláusulas seguintes."
      : `Sócios da sociedade ${d.name}, inscrita no CNPJ sob nº ${d.cnpj}, NIRE ${d.nire}, com sede em ${d.address}, resolvem formalizar o presente instrumento.`
  }\n\n`;

  if (d.act === "Constituição") {
    base += `CLÁUSULA 1ª • NOME EMPRESARIAL E SEDE\nA sociedade gira sob o nome empresarial ${d.name} e tem sede em ${d.address}.\n\nCLÁUSULA 2ª • OBJETO SOCIAL\nA sociedade tem por objeto: ${d.object}.\n\nCLÁUSULA 3ª • INÍCIO E DURAÇÃO\nAs atividades terão início em ${formatDateBr(d.start)}, e a duração da sociedade será por prazo indeterminado.\n\nCLÁUSULA 4ª • CAPITAL SOCIAL\nO capital social é de ${formatBrl(d.capital)}, dividido em ${Math.round(d.capital / d.quotaValue)} quotas de ${formatBrl(d.quotaValue)} cada, subscritas e integralizadas da seguinte forma:\n${d.distribution}\n\nCLÁUSULA 5ª • RESPONSABILIDADE\nA responsabilidade de cada sócio é restrita ao valor de suas quotas, mas todos respondem solidariamente pela integralização do capital social.\n\nCLÁUSULA 6ª • ADMINISTRAÇÃO\n${d.admins}\n\nCLÁUSULA 7ª • EXERCÍCIO SOCIAL\nAo término de cada exercício social, em 31 de dezembro, a administração prestará contas justificadas de sua gestão e elaborará os demonstrativos contábeis legalmente exigidos. Os resultados serão destinados conforme deliberação válida dos sócios e a legislação aplicável.\n\nCLÁUSULA 8ª • DECLARAÇÃO DE DESIMPEDIMENTO\nO(s) administrador(es) declara(m), sob as penas da lei, que não está(ão) impedido(s) de exercer a administração da sociedade por lei especial ou por condenação criminal nas hipóteses legais. A declaração deverá ser confirmada pelo(s) signatário(s).\n\nCLÁUSULA 9ª • DISPOSIÇÕES ESPECÍFICAS\n${d.extra || "[Completar regras aplicáveis de deliberação, cessão de quotas, retirada, sucessão, resolução e foro.]"}\n\n${
      d.size !== "Sem enquadramento"
        ? `ENQUADRAMENTO\n[Confirmar elegibilidade e inserir declaração de enquadramento como ${d.size} conforme a legislação aplicável.]\n\n`
        : ""
    }`;
  } else {
    base += `${d.changes}\n\n${
      d.consolidation ? "CONSOLIDAÇÃO DO CONTRATO SOCIAL\n\n" + d.consolidation + "\n\n" : ""
    }${d.extra ? d.extra + "\n\n" : ""}`;
  }

  base += `${d.city}, ${formatDateBr(d.signatureDate)}.\n\n[Assinaturas de todos os signatários exigidos para o ato]\n\n[Nome e qualificação do advogado e visto, quando exigível]`;

  return { title, text: base };
}
