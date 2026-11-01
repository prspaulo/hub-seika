import { z } from "zod";

export const statusTarefaSchema = z.enum([
  "A_FAZER",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
  "CONCLUIDO",
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
  status: statusTarefaSchema.default("A_FAZER"),
  notas: z.string().optional(),
});
export type CreateObrigacaoInput = z.infer<typeof createObrigacaoSchema>;

export const updateObrigacaoSchema = z.object({
  empresaId: z.string().uuid().nullable().optional(),
  owner: z.string().uuid().optional(),
  titulo: z.string().min(2).optional(),
  prazo: z.coerce.date().optional(),
  status: statusTarefaSchema.optional(),
  notas: z.string().optional(),
});
export type UpdateObrigacaoInput = z.infer<typeof updateObrigacaoSchema>;

export const listObrigacoesQuerySchema = z.object({
  empresaId: z.string().uuid().optional(),
  owner: z.string().uuid().optional(),
  status: statusTarefaSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListObrigacoesQuery = z.infer<typeof listObrigacoesQuerySchema>;
