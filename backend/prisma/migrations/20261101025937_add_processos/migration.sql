-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "processos";

-- CreateEnum
CREATE TYPE "processos"."StatusTarefa" AS ENUM ('A_FAZER', 'EM_ANDAMENTO', 'AGUARDANDO_CLIENTE', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "processos"."Setor" AS ENUM ('LEGALIZACAO', 'CONTABIL', 'FISCAL', 'DEPARTAMENTO_PESSOAL', 'TI', 'MARKETING', 'OPERACAO');

-- CreateEnum
CREATE TYPE "processos"."DescontoTipo" AS ENUM ('REAIS', 'PERCENTUAL');

-- CreateTable
CREATE TABLE "processos"."Processo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "setor" "processos"."Setor" NOT NULL,
    "nome" TEXT NOT NULL,
    "status" "processos"."StatusTarefa" NOT NULL DEFAULT 'A_FAZER',
    "valorInicialCentavos" INTEGER NOT NULL,
    "descontoTipo" "processos"."DescontoTipo" NOT NULL DEFAULT 'REAIS',
    "descontoCentavos" INTEGER,
    "descontoPercentual" DOUBLE PRECISION,
    "valorFinalCentavos" INTEGER NOT NULL,
    "prazo" TIMESTAMP(3) NOT NULL,
    "vencimentoCobranca" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "coraSolicitado" BOOLEAN NOT NULL DEFAULT false,
    "concluidoEm" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos"."Obrigacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "owner" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "prazo" TIMESTAMP(3) NOT NULL,
    "status" "processos"."StatusTarefa" NOT NULL DEFAULT 'A_FAZER',
    "notas" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obrigacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Processo_empresaId_idx" ON "processos"."Processo"("empresaId");

-- CreateIndex
CREATE INDEX "Processo_owner_idx" ON "processos"."Processo"("owner");

-- CreateIndex
CREATE INDEX "Obrigacao_empresaId_idx" ON "processos"."Obrigacao"("empresaId");

-- CreateIndex
CREATE INDEX "Obrigacao_owner_idx" ON "processos"."Obrigacao"("owner");
