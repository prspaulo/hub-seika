export type TipoMaterial =
  | "LIVRO"
  | "VIDEO"
  | "DOCUMENTO"
  | "FOTO"
  | "PLANILHA"
  | "APRESENTACAO"
  | "SITE";

export const TIPO_MATERIAL_LABEL: Record<TipoMaterial, string> = {
  LIVRO: "Livro",
  VIDEO: "Vídeo",
  DOCUMENTO: "Documento",
  FOTO: "Foto",
  PLANILHA: "Planilha",
  APRESENTACAO: "Apresentação",
  SITE: "Site",
};

export const AREA_SUGESTOES = ["TI", "Legalização", "Marketing", "Vendas", "Contabilidade"];

export type MaterialAcervo = {
  id: string;
  titulo: string;
  area: string;
  tipo: TipoMaterial;
  categoria: string | null;
  url: string;
  descricao: string | null;
  createdAt: string;
};
