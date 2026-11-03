import type { Empresa, ObrigacaoTemplate } from "@prisma/client";
import { competenciaAtual } from "../../shared/competencia.js";
import { authService } from "../auth/service.js";
import { empresasService } from "../clientes/service.js";
import { obrigacaoTemplatesRepository, obrigacoesRepository } from "./repository.js";
import type { GerarObrigacoesInput } from "./types.js";

// Espelha 1:1 os 15 `exigeX` do template com os 15 `possuiX`/`contribuinteX`/
// `sujeitoX` de Empresa (ver comentário no schema.prisma, model ObrigacaoTemplate).
const CONDICOES: { exige: string; possui: string }[] = [
  { exige: "exigeEmpregados", possui: "possuiEmpregados" },
  { exige: "exigeProLabore", possui: "possuiProLabore" },
  { exige: "exigeAutonomosRpa", possui: "possuiAutonomosRpa" },
  { exige: "exigeIcms", possui: "contribuinteIcms" },
  { exige: "exigeIss", possui: "contribuinteIss" },
  { exige: "exigeIpi", possui: "contribuinteIpi" },
  { exige: "exigeIcmsSt", possui: "possuiIcmsSt" },
  { exige: "exigeDifal", possui: "possuiDifal" },
  { exige: "exigeAntecipacaoTributaria", possui: "possuiAntecipacaoTributaria" },
  { exige: "exigeRetencoesFederais", possui: "possuiRetencoesFederais" },
  { exige: "exigeRetencaoInss", possui: "possuiRetencaoInss" },
  { exige: "exigeRetencaoIss", possui: "possuiRetencaoIss" },
  { exige: "exigeCprb", possui: "possuiCprb" },
  { exige: "exigeFatorR", possui: "sujeitoFatorR" },
  { exige: "exigeSstObrigatorio", possui: "possuiSstObrigatorio" },
];

function templateAplicaEmpresa(template: ObrigacaoTemplate, empresa: Empresa, referencia: Date): boolean {
  const regime = empresa.regimeTributario;
  if (!regime || !template.regimesAplicaveis.includes(regime)) return false;

  const atividade = empresa.naturezaAtividade;
  if (!atividade || !template.atividadesAplicaveis.includes(atividade)) return false;

  if (template.exigeLucroRealApuracao && empresa.lucroRealApuracao !== template.exigeLucroRealApuracao) {
    return false;
  }

  if (template.vigenciaInicio && referencia < template.vigenciaInicio) return false;
  if (template.vigenciaFim && referencia > template.vigenciaFim) return false;

  const templateRecord = template as unknown as Record<string, unknown>;
  const empresaRecord = empresa as unknown as Record<string, unknown>;
  for (const { exige, possui } of CONDICOES) {
    if (templateRecord[exige] === true && empresaRecord[possui] !== true) return false;
  }

  return true;
}

function parseCompetencia(competencia: string): { ano: number; mes: number } {
  const [ano, mes] = competencia.split("-").map(Number);
  return { ano, mes };
}

function addMeses(ano: number, mes: number, offset: number): { ano: number; mes: number } {
  const total = ano * 12 + (mes - 1) + offset;
  return { ano: Math.floor(total / 12), mes: (total % 12) + 1 };
}

// V1 pragmático: dia-base + offset de meses, sem calendário de feriados/UF —
// ver nota técnica da própria Cartilha SEIKA. Sempre editável pelo sócio no
// catálogo (ObrigacaoTemplate) e na obrigação já gerada.
function calcularPrazoLegal(template: ObrigacaoTemplate, competencia: string): Date {
  const { ano, mes } = parseCompetencia(competencia);
  const { ano: anoAlvo, mes: mesAlvo } = addMeses(ano, mes, template.prazoLegalMesesApos);
  const dia = Math.min(28, template.prazoLegalDia);
  return new Date(`${anoAlvo}-${String(mesAlvo).padStart(2, "0")}-${String(dia).padStart(2, "0")}T00:00:00.000Z`);
}

function chaveGeracao(templateId: string, empresaId: string, competencia: string): string {
  return `gerado:${templateId}:${empresaId}:${competencia}`;
}

export const obrigacoesGeradorService = {
  async gerar(input: GerarObrigacoesInput, actorId: string) {
    await authService.ensureUserExists(input.ownerId);
    const competencia = input.competencia ?? competenciaAtual();
    const { mes } = parseCompetencia(competencia);
    const referencia = new Date();

    const empresas = input.empresaId
      ? [await empresasService.getById(input.empresaId)]
      : (await empresasService.list({ status: "ATIVA", page: 1, pageSize: 1000 })).items;

    const templates = await obrigacaoTemplatesRepository.list({ ativo: true });

    let criadas = 0;
    let jaExistentes = 0;
    const itens = [];

    for (const empresa of empresas) {
      for (const template of templates) {
        if (!template.mesesCompetencia.includes(mes)) continue;
        if (!templateAplicaEmpresa(template, empresa, referencia)) continue;

        const chave = chaveGeracao(template.id, empresa.id, competencia);
        const existente = await obrigacoesRepository.findByChaveGeracao(chave);
        if (existente) {
          jaExistentes++;
          continue;
        }

        const prazoLegal = calcularPrazoLegal(template, competencia);
        const prazo = new Date(prazoLegal.getTime() - template.prazoInternoDiasAntes * 24 * 60 * 60 * 1000);

        const obrigacao = await obrigacoesRepository.create({
          empresaId: empresa.id,
          owner: input.ownerId,
          titulo: template.nome,
          prazo,
          prazoLegal,
          status: "AGUARDANDO_DOCUMENTOS",
          templateId: template.id,
          competencia,
          departamento: template.departamento,
          chaveGeracao: chave,
          ...(template.observacoes ? { notas: template.observacoes } : {}),
          createdBy: actorId,
          updatedBy: actorId,
        });
        criadas++;
        itens.push(obrigacao);
      }
    }

    return { competencia, criadas, jaExistentes, itens };
  },
};
