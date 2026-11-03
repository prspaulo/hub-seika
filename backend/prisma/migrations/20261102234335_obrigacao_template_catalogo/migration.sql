-- CreateEnum
CREATE TYPE "processos"."Periodicidade" AS ENUM ('MENSAL', 'TRIMESTRAL', 'ANUAL', 'EVENTUAL');

-- CreateTable
CREATE TABLE "processos"."ObrigacaoTemplate" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "departamento" "processos"."Setor" NOT NULL,
    "regimesAplicaveis" "clientes"."RegimeTributario"[],
    "atividadesAplicaveis" "clientes"."NaturezaAtividade"[],
    "periodicidade" "processos"."Periodicidade" NOT NULL,
    "mesesCompetencia" INTEGER[],
    "regraCompetencia" TEXT,
    "prazoLegalMesesApos" INTEGER NOT NULL DEFAULT 1,
    "prazoLegalDia" INTEGER NOT NULL DEFAULT 20,
    "prazoLegalDescricao" TEXT,
    "prazoInternoDiasAntes" INTEGER NOT NULL DEFAULT 5,
    "exigeMovimento" BOOLEAN NOT NULL DEFAULT false,
    "exigeEmpregados" BOOLEAN NOT NULL DEFAULT false,
    "exigeProLabore" BOOLEAN NOT NULL DEFAULT false,
    "exigeAutonomosRpa" BOOLEAN NOT NULL DEFAULT false,
    "exigeIcms" BOOLEAN NOT NULL DEFAULT false,
    "exigeIss" BOOLEAN NOT NULL DEFAULT false,
    "exigeIpi" BOOLEAN NOT NULL DEFAULT false,
    "exigeIcmsSt" BOOLEAN NOT NULL DEFAULT false,
    "exigeDifal" BOOLEAN NOT NULL DEFAULT false,
    "exigeAntecipacaoTributaria" BOOLEAN NOT NULL DEFAULT false,
    "exigeRetencoesFederais" BOOLEAN NOT NULL DEFAULT false,
    "exigeRetencaoInss" BOOLEAN NOT NULL DEFAULT false,
    "exigeRetencaoIss" BOOLEAN NOT NULL DEFAULT false,
    "exigeCprb" BOOLEAN NOT NULL DEFAULT false,
    "exigeFatorR" BOOLEAN NOT NULL DEFAULT false,
    "exigeSstObrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "geraGuia" BOOLEAN NOT NULL DEFAULT false,
    "dependencia" TEXT,
    "vigenciaInicio" TIMESTAMP(3),
    "vigenciaFim" TIMESTAMP(3),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObrigacaoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObrigacaoTemplate_codigo_key" ON "processos"."ObrigacaoTemplate"("codigo");

-- CreateIndex
CREATE INDEX "ObrigacaoTemplate_ativo_idx" ON "processos"."ObrigacaoTemplate"("ativo");
