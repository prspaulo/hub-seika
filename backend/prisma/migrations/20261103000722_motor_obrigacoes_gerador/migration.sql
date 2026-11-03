-- CreateEnum
CREATE TYPE "processos"."StatusObrigacao" AS ENUM ('AGUARDANDO_DOCUMENTOS', 'EM_ANALISE', 'EM_PROCESSAMENTO', 'EM_CONFERENCIA', 'CONCLUIDA', 'NAO_APLICAVEL');

-- AlterTable: novos campos do motor de geração (templateId/competencia/
-- departamento/prazoLegal/semMovimento/chaveGeracao)
ALTER TABLE "processos"."Obrigacao"
  ADD COLUMN "chaveGeracao" TEXT,
  ADD COLUMN "competencia" TEXT,
  ADD COLUMN "departamento" "processos"."Setor",
  ADD COLUMN "prazoLegal" TIMESTAMP(3),
  ADD COLUMN "semMovimento" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "templateId" TEXT,
  ADD COLUMN "statusNovo" "processos"."StatusObrigacao";

-- Remapeia os status existentes (StatusTarefa) para o novo StatusObrigacao
-- antes de trocar o tipo da coluna, preservando o histórico das obrigações
-- já cadastradas em vez de resetar tudo pro default.
UPDATE "processos"."Obrigacao" SET "statusNovo" = CASE "status"::text
  WHEN 'A_FAZER' THEN 'AGUARDANDO_DOCUMENTOS'
  WHEN 'AGUARDANDO_CLIENTE' THEN 'AGUARDANDO_DOCUMENTOS'
  WHEN 'EM_ANDAMENTO' THEN 'EM_PROCESSAMENTO'
  WHEN 'CONCLUIDO' THEN 'CONCLUIDA'
  ELSE 'AGUARDANDO_DOCUMENTOS'
END::"processos"."StatusObrigacao";

ALTER TABLE "processos"."Obrigacao" DROP COLUMN "status";
ALTER TABLE "processos"."Obrigacao" RENAME COLUMN "statusNovo" TO "status";
ALTER TABLE "processos"."Obrigacao" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "processos"."Obrigacao" ALTER COLUMN "status" SET DEFAULT 'AGUARDANDO_DOCUMENTOS';

-- AlterTable
ALTER TABLE "processos"."ObrigacaoTemplate" ADD COLUMN "exigeLucroRealApuracao" "clientes"."LucroRealApuracao";

-- CreateIndex
CREATE UNIQUE INDEX "Obrigacao_chaveGeracao_key" ON "processos"."Obrigacao"("chaveGeracao");

-- CreateIndex
CREATE INDEX "Obrigacao_templateId_idx" ON "processos"."Obrigacao"("templateId");
