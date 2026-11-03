export type EmpresaStatus = "ATIVA" | "INATIVA" | "SUSPENSA";
export type LicencaStatus = "VALIDA" | "VENCIDA" | "EM_RENOVACAO";
export type NaturezaJuridica =
  | "LTDA"
  | "SA"
  | "EI"
  | "SOCIEDADE_SIMPLES"
  | "MEI"
  | "COOPERATIVA"
  | "ASSOCIACAO";
export type PorteEmpresa = "ME" | "EPP" | "DEMAIS";
export type OrgaoRegistro = "OAB" | "JUNTA_COMERCIAL" | "CARTORIO";
export type RegimeTributario = "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL";
export type LucroRealApuracao = "TRIMESTRAL" | "ANUAL_ESTIMATIVA";
export type NaturezaAtividade = "SERVICO" | "COMERCIO" | "MISTA";

export const NATUREZA_JURIDICA_LABEL: Record<NaturezaJuridica, string> = {
  LTDA: "Sociedade Limitada (LTDA)",
  SA: "Sociedade Anônima (SA)",
  EI: "Empresário Individual (EI)",
  SOCIEDADE_SIMPLES: "Sociedade Simples",
  MEI: "MEI",
  COOPERATIVA: "Cooperativa",
  ASSOCIACAO: "Associação",
};

export const PORTE_EMPRESA_LABEL: Record<PorteEmpresa, string> = {
  ME: "Microempresa (ME)",
  EPP: "Empresa de Pequeno Porte (EPP)",
  DEMAIS: "Demais portes",
};

export const ORGAO_REGISTRO_LABEL: Record<OrgaoRegistro, string> = {
  OAB: "OAB",
  JUNTA_COMERCIAL: "Junta Comercial",
  CARTORIO: "Cartório",
};

export const REGIME_TRIBUTARIO_LABEL: Record<RegimeTributario, string> = {
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL: "Lucro Real",
};

export const LUCRO_REAL_APURACAO_LABEL: Record<LucroRealApuracao, string> = {
  TRIMESTRAL: "Trimestral",
  ANUAL_ESTIMATIVA: "Anual por estimativa mensal",
};

export const NATUREZA_ATIVIDADE_LABEL: Record<NaturezaAtividade, string> = {
  SERVICO: "Serviços",
  COMERCIO: "Comércio",
  MISTA: "Mista (serviços + comércio)",
};

// Checklist de características fiscais (seção 9 da Cartilha de Obrigações) —
// alimenta o Motor de Obrigações (Fase C). "Possui movimento no período" fica
// de fora de propósito: varia todo mês, não é característica fixa da empresa.
export const CARACTERISTICAS_FISCAIS = [
  { key: "possuiEmpregados", label: "Possui empregados?" },
  { key: "possuiProLabore", label: "Possui pró-labore?" },
  { key: "possuiAutonomosRpa", label: "Possui autônomos/RPA?" },
  { key: "contribuinteIcms", label: "É contribuinte de ICMS?" },
  { key: "contribuinteIss", label: "É contribuinte de ISS?" },
  { key: "contribuinteIpi", label: "É contribuinte de IPI?" },
  { key: "possuiIcmsSt", label: "Possui ICMS-ST?" },
  { key: "possuiDifal", label: "Possui DIFAL?" },
  { key: "possuiAntecipacaoTributaria", label: "Possui antecipação tributária?" },
  { key: "possuiRetencoesFederais", label: "Possui retenções federais?" },
  { key: "possuiRetencaoInss", label: "Possui retenção de INSS?" },
  { key: "possuiRetencaoIss", label: "Possui retenção de ISS?" },
  { key: "possuiCprb", label: "Possui CPRB?" },
  { key: "sujeitoFatorR", label: "Atividade sujeita ao Fator R?" },
  { key: "possuiSstObrigatorio", label: "Possui SST obrigatório?" },
] as const;

export type CaracteristicaFiscalKey = (typeof CARACTERISTICAS_FISCAIS)[number]["key"];

export type Licenca = {
  id: string;
  tipo: string;
  numero: string | null;
  status: LicencaStatus;
  validade: string | null;
};

export type SocioAdministrador = {
  id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
};

export type Filial = {
  id: string;
  nome: string;
  cnpj: string;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  enderecoCep: string | null;
};

export type Empresa = {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  status: EmpresaStatus;
  email: string | null;
  telefone: string | null;
  clienteDesde: string | null;
  capitalSocial: number | null;
  inscricaoMunicipal: string | null;
  inscricaoEstadual: string | null;
  nire: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  enderecoCep: string | null;
  temFilial: boolean;
  naturezaJuridica: NaturezaJuridica | null;
  porte: PorteEmpresa | null;
  orgaoRegistro: OrgaoRegistro | null;
  tipoAtividade: string | null;
  regimeTributario: RegimeTributario | null;
  lucroRealApuracao: LucroRealApuracao | null;
  naturezaAtividade: NaturezaAtividade | null;
  possuiEmpregados: boolean;
  possuiProLabore: boolean;
  possuiAutonomosRpa: boolean;
  contribuinteIcms: boolean;
  contribuinteIss: boolean;
  contribuinteIpi: boolean;
  possuiIcmsSt: boolean;
  possuiDifal: boolean;
  possuiAntecipacaoTributaria: boolean;
  possuiRetencoesFederais: boolean;
  possuiRetencaoInss: boolean;
  possuiRetencaoIss: boolean;
  possuiCprb: boolean;
  sujeitoFatorR: boolean;
  possuiSstObrigatorio: boolean;
  certificadoDigitalUrl: string | null;
  certificadoDigitalVencimento: string | null;
  createdAt: string;
  updatedAt: string;
};

export function formatCnpj(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR");
}

// "Vencido" quando a data já passou; "vence em breve" dentro de 30 dias —
// mesmo critério usado pra licenças/obrigações no resto do app.
export function certificadoVencimentoStatus(vencimento: string | null): "ok" | "vence_em_breve" | "vencido" | null {
  if (!vencimento) return null;
  const dias = (new Date(vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (dias < 0) return "vencido";
  if (dias <= 30) return "vence_em_breve";
  return "ok";
}
