export type StatusTarefa = "A_FAZER" | "EM_ANDAMENTO" | "AGUARDANDO_CLIENTE" | "CONCLUIDO";
// Status próprio de Obrigacao (distinto de StatusTarefa, que Processo
// continua usando) — ver nota no schema.prisma do backend.
export type StatusObrigacao =
  | "AGUARDANDO_DOCUMENTOS"
  | "EM_ANALISE"
  | "EM_PROCESSAMENTO"
  | "EM_CONFERENCIA"
  | "CONCLUIDA"
  | "NAO_APLICAVEL";
export type Setor =
  | "LEGALIZACAO"
  | "CONTABIL"
  | "FISCAL"
  | "DEPARTAMENTO_PESSOAL"
  | "TI"
  | "MARKETING"
  | "OPERACAO";
export type DescontoTipo = "REAIS" | "PERCENTUAL";

export const STATUS_LABEL: Record<StatusTarefa, string> = {
  A_FAZER: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  CONCLUIDO: "Concluído",
};

export const STATUS_ORDER: StatusTarefa[] = [
  "A_FAZER",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
  "CONCLUIDO",
];

export const STATUS_OBRIGACAO_LABEL: Record<StatusObrigacao, string> = {
  AGUARDANDO_DOCUMENTOS: "Aguardando documentos",
  EM_ANALISE: "Em análise",
  EM_PROCESSAMENTO: "Em processamento",
  EM_CONFERENCIA: "Em conferência",
  CONCLUIDA: "Concluída",
  NAO_APLICAVEL: "Não aplicável",
};

export const STATUS_OBRIGACAO_ORDER: StatusObrigacao[] = [
  "AGUARDANDO_DOCUMENTOS",
  "EM_ANALISE",
  "EM_PROCESSAMENTO",
  "EM_CONFERENCIA",
  "CONCLUIDA",
  "NAO_APLICAVEL",
];

export const SETOR_LABEL: Record<Setor, string> = {
  LEGALIZACAO: "Legalização",
  CONTABIL: "Contábil",
  FISCAL: "Fiscal",
  DEPARTAMENTO_PESSOAL: "Departamento Pessoal",
  TI: "TI",
  MARKETING: "Marketing",
  OPERACAO: "Operação",
};

export type Processo = {
  id: string;
  empresaId: string;
  owner: string;
  setor: Setor;
  nome: string;
  status: StatusTarefa;
  descontoTipo: DescontoTipo;
  valorInicial: number;
  desconto: number;
  valorFinal: number;
  prazo: string;
  vencimentoCobranca: string;
  descricao: string | null;
  coraSolicitado: boolean;
  concluidoEm: string | null;
  createdAt: string;
};

export type Obrigacao = {
  id: string;
  empresaId: string | null;
  owner: string;
  titulo: string;
  prazo: string;
  status: StatusObrigacao;
  notas: string | null;
  // Preenchidos só quando vem do Motor de Obrigações — null em obrigações manuais.
  templateId: string | null;
  competencia: string | null;
  departamento: Setor | null;
  prazoLegal: string | null;
  semMovimento: boolean;
  createdAt: string;
};

export type ResponsavelDepartamento = {
  departamento: Setor;
  ownerId: string;
  updatedAt: string;
};

export type ObrigacaoGrupo = { empresaId: string | null; nome: string; itens: Obrigacao[] };

// Agrupa preservando a ordenação já aplicada em `itens` (ex: por prazo) dentro
// de cada grupo — só reparte em "baldes" por empresa, sem reordenar.
export function agruparObrigacoesPorEmpresa(
  itens: Obrigacao[],
  nomeEmpresa: (empresaId: string) => string,
): ObrigacaoGrupo[] {
  const grupos = new Map<string, ObrigacaoGrupo>();
  for (const item of itens) {
    const chave = item.empresaId ?? "__interna__";
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        empresaId: item.empresaId,
        nome: item.empresaId ? nomeEmpresa(item.empresaId) : "Interna / sem cliente",
        itens: [],
      });
    }
    grupos.get(chave)!.itens.push(item);
  }
  return [...grupos.values()].sort((a, b) => {
    if (a.empresaId === null) return 1;
    if (b.empresaId === null) return -1;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR");
}

export type AtrasoObrigacao = "vencido_legal" | "vencido_interno" | "ok";

export const ATRASO_LABEL: Record<AtrasoObrigacao, string> = {
  vencido_legal: "Prazo legal vencido",
  vencido_interno: "Prazo interno vencido",
  ok: "Em dia",
};

// "Vencido" (legal ou interno) não é gravado — é calculado comparando com
// hoje, igual seção 10 da Cartilha SEIKA. Concluída/Não aplicável nunca
// aparecem como vencidas.
export function obrigacaoAtraso(obrigacao: Obrigacao): AtrasoObrigacao | null {
  if (obrigacao.status === "CONCLUIDA" || obrigacao.status === "NAO_APLICAVEL") return null;
  const hoje = Date.now();
  if (obrigacao.prazoLegal && new Date(obrigacao.prazoLegal).getTime() < hoje) return "vencido_legal";
  if (new Date(obrigacao.prazo).getTime() < hoje) return "vencido_interno";
  return "ok";
}
