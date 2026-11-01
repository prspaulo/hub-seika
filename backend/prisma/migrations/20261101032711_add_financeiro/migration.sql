-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "financeiro";

-- CreateEnum
CREATE TYPE "financeiro"."TipoCobranca" AS ENUM ('ESPORADICO', 'MENSAL', 'AJUSTE');

-- CreateEnum
CREATE TYPE "financeiro"."StatusCobranca" AS ENUM ('PENDENTE', 'PAGO');

-- CreateEnum
CREATE TYPE "financeiro"."FormaPagamento" AS ENUM ('PIX', 'BOLETO', 'TRANSFERENCIA', 'DINHEIRO', 'CARTAO');

-- CreateTable
CREATE TABLE "financeiro"."Cobranca" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "processoId" TEXT,
    "descricao" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "tipo" "financeiro"."TipoCobranca" NOT NULL,
    "chaveMensal" TEXT,
    "status" "financeiro"."StatusCobranca" NOT NULL DEFAULT 'PENDENTE',
    "valorPagoCentavos" INTEGER,
    "pagoEm" TIMESTAMP(3),
    "formaPagamento" "financeiro"."FormaPagamento",
    "observacao" TEXT,
    "recebidoPor" TEXT,
    "coraSolicitado" BOOLEAN NOT NULL DEFAULT false,
    "coraStatus" TEXT,
    "estornoMotivo" TEXT,
    "estornoPor" TEXT,
    "estornoEm" TIMESTAMP(3),
    "estornoPagoEmAnterior" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."Mensalidade" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "ativaDesde" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mensalidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."Despesa" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "status" "financeiro"."StatusCobranca" NOT NULL DEFAULT 'PENDENTE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."AuditLogFinanceiro" (
    "id" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "ator" TEXT NOT NULL,
    "detalhes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cobranca_chaveMensal_key" ON "financeiro"."Cobranca"("chaveMensal");

-- CreateIndex
CREATE INDEX "Cobranca_empresaId_idx" ON "financeiro"."Cobranca"("empresaId");

-- CreateIndex
CREATE INDEX "Cobranca_status_idx" ON "financeiro"."Cobranca"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Mensalidade_empresaId_key" ON "financeiro"."Mensalidade"("empresaId");

-- CreateIndex
CREATE INDEX "AuditLogFinanceiro_entidade_entidadeId_idx" ON "financeiro"."AuditLogFinanceiro"("entidade", "entidadeId");
