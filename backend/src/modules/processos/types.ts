import { z } from "zod";
import { lucroRealApuracaoSchema, naturezaAtividadeSchema, regimeTributarioSchema } from "../clientes/types.js";

export const statusTarefaSchema = z.enum([
  "A_FAZER",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
  "CONCLUIDO",
]);

// Status próprio de Obrigacao — ver nota no schema.prisma sobre por que é
// distinto de StatusTarefa (que Processo continua usando).
export const statusObrigacaoSchema = z.enum([
  "AGUARDANDO_DOCUMENTOS",
  "EM_ANALISE",
  "EM_PROCESSAMENTO",
  "EM_CONFERENCIA",
  "CONCLUIDA",
  "NAO_APLICAVEL",
]);

export const setorSchema = z.enum([
  "LEGALIZACAO",
  "CONTABIL",
  "FISCAL",
  "DEPARTAMENTO_PESSOAL",
  "TI",
  "MARKETING",
  "OPERACAO",
]);

const descontoFields = z.discriminatedUnion("descontoTipo", [
  z.object({ descontoTipo: z.literal("REAIS"), desconto: z.number().min(0) }),
  z.object({ descontoTipo: z.literal("PERCENTUAL"), desconto: z.number().min(0).max(100) }),
]);

export const createProcessoSchema = z
  .object({
    empresaId: z.string().uuid(),
    owner: z.string().uuid(),
    setor: setorSchema,
    nome: z.string().min(2),
    status: statusTarefaSchema.default("A_FAZER"),
    valorInicial: z.number().min(0),
    prazo: z.coerce.date(),
    vencimentoCobranca: z.coerce.date(),
    descricao: z.string().optional(),
    coraSolicitado: z.boolean().default(false),
  })
  .and(descontoFields)
  .refine((data) => data.descontoTipo !== "REAIS" || data.desconto <= data.valorInicial, {
    message: "O desconto em R$ não pode ser maior que o valor inicial",
    path: ["desconto"],
  });
export type CreateProcessoInput = z.infer<typeof createProcessoSchema>;

export const updateProcessoSchema = z.object({
  setor: setorSchema.optional(),
  nome: z.string().min(2).optional(),
  status: statusTarefaSchema.optional(),
  owner: z.string().uuid().optional(),
  prazo: z.coerce.date().optional(),
  vencimentoCobranca: z.coerce.date().optional(),
  descricao: z.string().optional(),
  coraSolicitado: z.boolean().optional(),
});
export type UpdateProcessoInput = z.infer<typeof updateProcessoSchema>;

export const listProcessosQuerySchema = z.object({
  empresaId: z.string().uuid().optional(),
  owner: z.string().uuid().optional(),
  status: statusTarefaSchema.optional(),
  setor: setorSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListProcessosQuery = z.infer<typeof listProcessosQuerySchema>;

export const createObrigacaoSchema = z.object({
  empresaId: z.string().uuid().optional(),
  owner: z.string().uuid(),
  titulo: z.string().min(2),
  prazo: z.coerce.date(),
  status: statusObrigacaoSchema.default("AGUARDANDO_DOCUMENTOS"),
  notas: z.string().optional(),
});
export type CreateObrigacaoInput = z.infer<typeof createObrigacaoSchema>;

export const updateObrigacaoSchema = z.object({
  empresaId: z.string().uuid().nullable().optional(),
  owner: z.string().uuid().optional(),
  titulo: z.string().min(2).optional(),
  prazo: z.coerce.date().optional(),
  // Correção pontual do prazo legal de uma obrigação já gerada (ex: regra do
  // template caiu num feriado) — a regra em si continua editável no catálogo.
  prazoLegal: z.coerce.date().optional(),
  status: statusObrigacaoSchema.optional(),
  notas: z.string().optional(),
  semMovimento: z.boolean().optional(),
});
export type UpdateObrigacaoInput = z.infer<typeof updateObrigacaoSchema>;

export const listObrigacoesQuerySchema = z.object({
  empresaId: z.string().uuid().optional(),
  owner: z.string().uuid().optional(),
  status: statusObrigacaoSchema.optional(),
  competencia: z.string().optional(),
  departamento: setorSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListObrigacoesQuery = z.infer<typeof listObrigacoesQuerySchema>;

// --- Catálogo de obrigações (Motor de Obrigações — Cartilha SEIKA) ---

export const periodicidadeSchema = z.enum(["MENSAL", "TRIMESTRAL", "ANUAL", "EVENTUAL"]);

export const createObrigacaoTemplateSchema = z.object({
  codigo: z.string().min(2),
  nome: z.string().min(2),
  grupo: z.string().min(2),
  departamento: setorSchema,
  regimesAplicaveis: z.array(regimeTributarioSchema).min(1),
  atividadesAplicaveis: z.array(naturezaAtividadeSchema).min(1),
  exigeLucroRealApuracao: lucroRealApuracaoSchema.optional(),
  periodicidade: periodicidadeSchema,
  // Vazio é válido pra EVENTUAL (não entra no calendário automático, só
  // gerada manualmente) — demais periodicidades normalmente têm >= 1 mês,
  // mas isso não é imposto aqui pra não travar cadastro incompleto.
  mesesCompetencia: z.array(z.number().int().min(1).max(12)),
  regraCompetencia: z.string().optional(),
  prazoLegalMesesApos: z.number().int().min(0).default(1),
  prazoLegalDia: z.number().int().min(1).max(31).default(20),
  prazoLegalDescricao: z.string().optional(),
  prazoInternoDiasAntes: z.number().int().min(0).default(5),
  exigeMovimento: z.boolean().default(false),
  exigeEmpregados: z.boolean().default(false),
  exigeProLabore: z.boolean().default(false),
  exigeAutonomosRpa: z.boolean().default(false),
  exigeIcms: z.boolean().default(false),
  exigeIss: z.boolean().default(false),
  exigeIpi: z.boolean().default(false),
  exigeIcmsSt: z.boolean().default(false),
  exigeDifal: z.boolean().default(false),
  exigeAntecipacaoTributaria: z.boolean().default(false),
  exigeRetencoesFederais: z.boolean().default(false),
  exigeRetencaoInss: z.boolean().default(false),
  exigeRetencaoIss: z.boolean().default(false),
  exigeCprb: z.boolean().default(false),
  exigeFatorR: z.boolean().default(false),
  exigeSstObrigatorio: z.boolean().default(false),
  geraGuia: z.boolean().default(false),
  dependencia: z.string().optional(),
  vigenciaInicio: z.coerce.date().optional(),
  vigenciaFim: z.coerce.date().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().default(true),
});
export type CreateObrigacaoTemplateInput = z.infer<typeof createObrigacaoTemplateSchema>;

export const updateObrigacaoTemplateSchema = z.object({
  codigo: z.string().min(2).optional(),
  nome: z.string().min(2).optional(),
  grupo: z.string().min(2).optional(),
  departamento: setorSchema.optional(),
  regimesAplicaveis: z.array(regimeTributarioSchema).min(1).optional(),
  atividadesAplicaveis: z.array(naturezaAtividadeSchema).min(1).optional(),
  exigeLucroRealApuracao: lucroRealApuracaoSchema.optional(),
  periodicidade: periodicidadeSchema.optional(),
  mesesCompetencia: z.array(z.number().int().min(1).max(12)).optional(),
  regraCompetencia: z.string().optional(),
  prazoLegalMesesApos: z.number().int().min(0).optional(),
  prazoLegalDia: z.number().int().min(1).max(31).optional(),
  prazoLegalDescricao: z.string().optional(),
  prazoInternoDiasAntes: z.number().int().min(0).optional(),
  exigeMovimento: z.boolean().optional(),
  exigeEmpregados: z.boolean().optional(),
  exigeProLabore: z.boolean().optional(),
  exigeAutonomosRpa: z.boolean().optional(),
  exigeIcms: z.boolean().optional(),
  exigeIss: z.boolean().optional(),
  exigeIpi: z.boolean().optional(),
  exigeIcmsSt: z.boolean().optional(),
  exigeDifal: z.boolean().optional(),
  exigeAntecipacaoTributaria: z.boolean().optional(),
  exigeRetencoesFederais: z.boolean().optional(),
  exigeRetencaoInss: z.boolean().optional(),
  exigeRetencaoIss: z.boolean().optional(),
  exigeCprb: z.boolean().optional(),
  exigeFatorR: z.boolean().optional(),
  exigeSstObrigatorio: z.boolean().optional(),
  geraGuia: z.boolean().optional(),
  dependencia: z.string().optional(),
  vigenciaInicio: z.coerce.date().optional(),
  vigenciaFim: z.coerce.date().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().optional(),
});
export type UpdateObrigacaoTemplateInput = z.infer<typeof updateObrigacaoTemplateSchema>;

export const listObrigacaoTemplatesQuerySchema = z.object({
  ativo: z.coerce.boolean().optional(),
  regime: regimeTributarioSchema.optional(),
  atividade: naturezaAtividadeSchema.optional(),
  search: z.string().optional(),
});
export type ListObrigacaoTemplatesQuery = z.infer<typeof listObrigacaoTemplatesQuerySchema>;

// --- Motor de geração ---

export const gerarObrigacoesSchema = z.object({
  ownerId: z.string().uuid(),
  competencia: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Competência deve estar no formato YYYY-MM")
    .optional(),
  empresaId: z.string().uuid().optional(),
});
export type GerarObrigacoesInput = z.infer<typeof gerarObrigacoesSchema>;
