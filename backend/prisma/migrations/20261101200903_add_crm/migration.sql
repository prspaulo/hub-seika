-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "crm";

-- CreateEnum
CREATE TYPE "crm"."EstagioLead" AS ENUM ('CONTATADO', 'EM_ANDAMENTO', 'PROPOSTA_ENVIADA', 'FECHADO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "crm"."TipoAcaoProspeccao" AS ENUM ('ABORDAGEM', 'REUNIAO', 'PROPOSTA', 'CLIENTE', 'CAFE');

-- CreateTable
CREATE TABLE "crm"."Lead" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "empresaNome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "segmento" TEXT,
    "origem" TEXT,
    "estagio" "crm"."EstagioLead" NOT NULL DEFAULT 'CONTATADO',
    "valorPropostaCentavos" INTEGER,
    "observacoes" TEXT,
    "perdidoMotivo" TEXT,
    "ownerId" TEXT NOT NULL,
    "empresaId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."AcaoProspeccao" (
    "id" TEXT NOT NULL,
    "tipo" "crm"."TipoAcaoProspeccao" NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcaoProspeccao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."ServicoPreco" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "mensal" BOOLEAN NOT NULL DEFAULT false,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicoPreco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_ownerId_idx" ON "crm"."Lead"("ownerId");

-- CreateIndex
CREATE INDEX "Lead_estagio_idx" ON "crm"."Lead"("estagio");

-- CreateIndex
CREATE INDEX "AcaoProspeccao_ownerId_idx" ON "crm"."AcaoProspeccao"("ownerId");

-- CreateIndex
CREATE INDEX "AcaoProspeccao_leadId_idx" ON "crm"."AcaoProspeccao"("leadId");
