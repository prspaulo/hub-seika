import { z } from "zod";

export const tipoMaterialSchema = z.enum([
  "LIVRO",
  "VIDEO",
  "DOCUMENTO",
  "FOTO",
  "PLANILHA",
  "APRESENTACAO",
  "SITE",
]);

export const createMaterialSchema = z.object({
  titulo: z.string().min(2),
  area: z.string().min(2),
  tipo: tipoMaterialSchema.default("DOCUMENTO"),
  categoria: z.string().optional(),
  url: z.string().url("Informe um link válido"),
  descricao: z.string().optional(),
});
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;

export const updateMaterialSchema = z.object({
  titulo: z.string().min(2).optional(),
  area: z.string().min(2).optional(),
  tipo: tipoMaterialSchema.optional(),
  categoria: z.string().optional(),
  url: z.string().url("Informe um link válido").optional(),
  descricao: z.string().optional(),
});
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;

export const listMateriaisQuerySchema = z.object({
  search: z.string().optional(),
  area: z.string().optional(),
});
export type ListMateriaisQuery = z.infer<typeof listMateriaisQuerySchema>;
