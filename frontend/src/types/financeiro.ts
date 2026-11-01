export type TipoCobranca = "ESPORADICO" | "MENSAL" | "AJUSTE";
export type StatusComputado = "PENDENTE" | "PAGO" | "ATRASADO";
export type FormaPagamento = "PIX" | "BOLETO" | "TRANSFERENCIA" | "DINHEIRO" | "CARTAO";

export const TIPO_LABEL: Record<TipoCobranca, string> = {
  ESPORADICO: "Esporádico",
  MENSAL: "Mensal",
  AJUSTE: "Ajuste",
};

export const STATUS_COMPUTADO_LABEL: Record<StatusComputado, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  ATRASADO: "Atrasado",
};

export type Cobranca = {
  id: string;
  virtual: boolean;
  empresaId: string;
  processoId: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  tipo: TipoCobranca;
  statusComputado: StatusComputado;
  valorPago: number | null;
  pagoEm: string | null;
  formaPagamento: FormaPagamento | null;
  coraStatus: string | null;
};

export type Despesa = {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  competencia: string;
  status: "PENDENTE" | "PAGO";
};

export type Resumo = {
  recebido: number;
  aReceber: number;
  atrasado: number;
  despesasPagas: number;
};

export type SaidaCliente = {
  empresaId: string;
  razaoSocial: string;
  saldoAberto: number;
};
