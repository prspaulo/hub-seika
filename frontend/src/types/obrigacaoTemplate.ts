import type { Setor } from "./processo";

export type Periodicidade = "MENSAL" | "TRIMESTRAL" | "ANUAL" | "EVENTUAL";

export const PERIODICIDADE_LABEL: Record<Periodicidade, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  ANUAL: "Anual",
  EVENTUAL: "Eventual",
};

export const MESES_LABEL: Record<number, string> = {
  1: "Jan",
  2: "Fev",
  3: "Mar",
  4: "Abr",
  5: "Mai",
  6: "Jun",
  7: "Jul",
  8: "Ago",
  9: "Set",
  10: "Out",
  11: "Nov",
  12: "Dez",
};

// Espelha 1:1 os 15 booleanos de características fiscais do cadastro de
// Empresa (types/empresa.ts) — o Motor de Obrigações (Fase C) casa cada
// `exigeX` daqui com o `possuiX`/`contribuinteX`/`sujeitoX` correspondente lá.
export const CARACTERISTICAS_TEMPLATE = [
  { key: "exigeEmpregados", label: "Exige empregados?" },
  { key: "exigeProLabore", label: "Exige pró-labore?" },
  { key: "exigeAutonomosRpa", label: "Exige autônomos/RPA?" },
  { key: "exigeIcms", label: "Exige contribuinte de ICMS?" },
  { key: "exigeIss", label: "Exige contribuinte de ISS?" },
  { key: "exigeIpi", label: "Exige contribuinte de IPI?" },
  { key: "exigeIcmsSt", label: "Exige ICMS-ST?" },
  { key: "exigeDifal", label: "Exige DIFAL?" },
  { key: "exigeAntecipacaoTributaria", label: "Exige antecipação tributária?" },
  { key: "exigeRetencoesFederais", label: "Exige retenções federais?" },
  { key: "exigeRetencaoInss", label: "Exige retenção de INSS?" },
  { key: "exigeRetencaoIss", label: "Exige retenção de ISS?" },
  { key: "exigeCprb", label: "Exige CPRB?" },
  { key: "exigeFatorR", label: "Exige Fator R?" },
  { key: "exigeSstObrigatorio", label: "Exige SST obrigatório?" },
] as const;

export type CaracteristicaTemplateKey = (typeof CARACTERISTICAS_TEMPLATE)[number]["key"];

export type ObrigacaoTemplate = {
  id: string;
  codigo: string;
  nome: string;
  grupo: string;
  departamento: Setor;
  regimesAplicaveis: string[];
  atividadesAplicaveis: string[];
  periodicidade: Periodicidade;
  mesesCompetencia: number[];
  regraCompetencia: string | null;
  prazoLegalMesesApos: number;
  prazoLegalDia: number;
  prazoLegalDescricao: string | null;
  prazoInternoDiasAntes: number;
  exigeMovimento: boolean;
  exigeEmpregados: boolean;
  exigeProLabore: boolean;
  exigeAutonomosRpa: boolean;
  exigeIcms: boolean;
  exigeIss: boolean;
  exigeIpi: boolean;
  exigeIcmsSt: boolean;
  exigeDifal: boolean;
  exigeAntecipacaoTributaria: boolean;
  exigeRetencoesFederais: boolean;
  exigeRetencaoInss: boolean;
  exigeRetencaoIss: boolean;
  exigeCprb: boolean;
  exigeFatorR: boolean;
  exigeSstObrigatorio: boolean;
  geraGuia: boolean;
  dependencia: string | null;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  observacoes: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};
