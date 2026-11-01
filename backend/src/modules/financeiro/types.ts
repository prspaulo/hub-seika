import { z } from "zod";

export const tipoCobrancaSchema = z.enum(["ESPORADICO", "MENSAL", "AJUSTE"]);
export const formaPagamentoSchema = z.enum(["PIX", "BOLETO", "TRANSFERENCIA", "DINHEIRO", "CARTAO"]);
export const statusComputadoSchema = z.enum(["PENDENTE", "PAGO", "ATRASADO"]);

export const createCobrancaSchema = z
  .object({
    empresaId: z.string().uuid(),
    descricao: z.string().min(2),
    valor: z.number().min(0.01),
    vencimento: z.coerce.date(),
    tipo: tipoCobrancaSchema.default("ESPORADICO"),
    competencia: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Competência deve estar no formato AAAA-MM")
      .optional(),
  })
  .refine((data) => data.tipo !== "MENSAL" || !!data.competencia, {
    message: "Competência é obrigatória para lançamentos mensais",
    path: ["competencia"],
  });
export type CreateCobrancaInput = z.infer<typeof createCobrancaSchema>;

export const registrarPagamentoSchema = z.object({
  valor: z.number().min(0),
  pagoEm: z.coerce.date(),
  formaPagamento: formaPagamentoSchema,
  observacao: z.string().optional(),
});
export type RegistrarPagamentoInput = z.infer<typeof registrarPagamentoSchema>;

export const estornoSchema = z.object({
  motivo: z.string().min(3),
});
export type EstornoInput = z.infer<typeof estornoSchema>;

export const listCobrancasQuerySchema = z.object({
  empresaId: z.string().uuid().optional(),
  tipo: tipoCobrancaSchema.optional(),
  status: statusComputadoSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListCobrancasQuery = z.infer<typeof listCobrancasQuerySchema>;

export const createDespesaSchema = z.object({
  descricao: z.string().min(2),
  categoria: z.string().min(2).default("Operacional"),
  valor: z.number().min(0.01),
  competencia: z.coerce.date(),
  status: z.enum(["PENDENTE", "PAGO"]).default("PENDENTE"),
});
export type CreateDespesaInput = z.infer<typeof createDespesaSchema>;

export const mensalidadeSchema = z.object({
  valor: z.number().min(0.01),
  diaVencimento: z.number().int().min(1).max(28),
  ativaDesde: z.coerce.date(),
  ativo: z.boolean().default(true),
});
export type MensalidadeInput = z.infer<typeof mensalidadeSchema>;
