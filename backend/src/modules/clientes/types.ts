import { z } from "zod";
import { isValidCnpj, normalizeCnpj } from "../../shared/cnpj.js";

const cnpjField = z
  .string()
  .transform(normalizeCnpj)
  .refine((value) => isValidCnpj(value), { message: "CNPJ inválido" });

export const empresaStatusSchema = z.enum(["ATIVA", "INATIVA", "SUSPENSA"]);
export const naturezaJuridicaSchema = z.enum([
  "LTDA",
  "SA",
  "EI",
  "SOCIEDADE_SIMPLES",
  "MEI",
  "COOPERATIVA",
  "ASSOCIACAO",
]);
export const porteEmpresaSchema = z.enum(["ME", "EPP", "DEMAIS"]);
export const orgaoRegistroSchema = z.enum(["OAB", "JUNTA_COMERCIAL", "CARTORIO"]);

const enderecoFields = {
  enderecoLogradouro: z.string().min(2).optional(),
  enderecoNumero: z.string().optional(),
  enderecoComplemento: z.string().optional(),
  enderecoBairro: z.string().optional(),
  enderecoCidade: z.string().optional(),
  enderecoUf: z.string().length(2).optional(),
  enderecoCep: z.string().optional(),
};

const cadastroFields = {
  clienteDesde: z.coerce.date().optional(),
  capitalSocial: z.number().min(0).optional(),
  inscricaoMunicipal: z.string().min(1).optional(),
  inscricaoEstadual: z.string().min(1).optional(),
  nire: z.string().min(1).optional(),
  temFilial: z.boolean().optional(),
  naturezaJuridica: naturezaJuridicaSchema.optional(),
  porte: porteEmpresaSchema.optional(),
  orgaoRegistro: orgaoRegistroSchema.optional(),
  tipoAtividade: z.string().min(2).optional(),
  certificadoDigitalUrl: z.string().url().optional(),
  certificadoDigitalVencimento: z.coerce.date().optional(),
};

export const createEmpresaSchema = z.object({
  razaoSocial: z.string().min(2),
  nomeFantasia: z.string().min(1).optional(),
  cnpj: cnpjField,
  email: z.string().email().optional(),
  telefone: z.string().min(8).optional(),
  ...enderecoFields,
  ...cadastroFields,
});
export type CreateEmpresaInput = z.infer<typeof createEmpresaSchema>;

export const updateEmpresaSchema = z.object({
  razaoSocial: z.string().min(2).optional(),
  nomeFantasia: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telefone: z.string().min(8).optional(),
  status: empresaStatusSchema.optional(),
  ...enderecoFields,
  ...cadastroFields,
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

export const createSocioAdministradorSchema = z.object({
  nome: z.string().min(2),
  cpf: z.string().min(11).optional(),
  email: z.string().email().optional(),
  telefone: z.string().min(8).optional(),
});
export type CreateSocioAdministradorInput = z.infer<typeof createSocioAdministradorSchema>;

export const updateSocioAdministradorSchema = z.object({
  nome: z.string().min(2).optional(),
  cpf: z.string().min(11).optional(),
  email: z.string().email().optional(),
  telefone: z.string().min(8).optional(),
});
export type UpdateSocioAdministradorInput = z.infer<typeof updateSocioAdministradorSchema>;

export const createFilialSchema = z.object({
  nome: z.string().min(2),
  cnpj: cnpjField,
  ...enderecoFields,
});
export type CreateFilialInput = z.infer<typeof createFilialSchema>;

export const updateFilialSchema = z.object({
  nome: z.string().min(2).optional(),
  cnpj: cnpjField.optional(),
  ...enderecoFields,
});
export type UpdateFilialInput = z.infer<typeof updateFilialSchema>;
