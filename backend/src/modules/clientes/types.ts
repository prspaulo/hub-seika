import { z } from "zod";
import { isValidCnpj, normalizeCnpj } from "../../shared/cnpj.js";

const cnpjField = z
  .string()
  .transform(normalizeCnpj)
  .refine((value) => isValidCnpj(value), { message: "CNPJ inválido" });

export const empresaStatusSchema = z.enum(["ATIVA", "INATIVA", "SUSPENSA"]);

export const createEmpresaSchema = z.object({
  razaoSocial: z.string().min(2),
  nomeFantasia: z.string().min(1).optional(),
  cnpj: cnpjField,
  email: z.string().email().optional(),
  telefone: z.string().min(8).optional(),
});
export type CreateEmpresaInput = z.infer<typeof createEmpresaSchema>;

export const updateEmpresaSchema = z.object({
  razaoSocial: z.string().min(2).optional(),
  nomeFantasia: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telefone: z.string().min(8).optional(),
  status: empresaStatusSchema.optional(),
});
export type UpdateEmpresaInput = z.infer<typeof updateEmpresaSchema>;

export const listEmpresasQuerySchema = z.object({
  search: z.string().optional(),
  status: empresaStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListEmpresasQuery = z.infer<typeof listEmpresasQuerySchema>;

export const licencaStatusSchema = z.enum(["VALIDA", "VENCIDA", "EM_RENOVACAO"]);

export const createLicencaSchema = z.object({
  tipo: z.string().min(2),
  numero: z.string().min(1).optional(),
  status: licencaStatusSchema.default("VALIDA"),
  validade: z.coerce.date().optional(),
});
export type CreateLicencaInput = z.infer<typeof createLicencaSchema>;

export const updateLicencaSchema = z.object({
  tipo: z.string().min(2).optional(),
  numero: z.string().min(1).optional(),
  status: licencaStatusSchema.optional(),
  validade: z.coerce.date().optional(),
});
export type UpdateLicencaInput = z.infer<typeof updateLicencaSchema>;
