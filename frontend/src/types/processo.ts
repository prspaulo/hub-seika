export type StatusTarefa = "A_FAZER" | "EM_ANDAMENTO" | "AGUARDANDO_CLIENTE" | "CONCLUIDO";
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
  status: StatusTarefa;
  notas: string | null;
  createdAt: string;
};

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR");
}
