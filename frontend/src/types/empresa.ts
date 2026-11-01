export type EmpresaStatus = "ATIVA" | "INATIVA" | "SUSPENSA";
export type LicencaStatus = "VALIDA" | "VENCIDA" | "EM_RENOVACAO";

export type Licenca = {
  id: string;
  tipo: string;
  numero: string | null;
  status: LicencaStatus;
  validade: string | null;
};

export type Empresa = {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  status: EmpresaStatus;
  email: string | null;
  telefone: string | null;
  createdAt: string;
  updatedAt: string;
};

export function formatCnpj(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
