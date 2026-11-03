-- CreateEnum
CREATE TYPE "clientes"."RegimeTributario" AS ENUM ('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- CreateEnum
CREATE TYPE "clientes"."LucroRealApuracao" AS ENUM ('TRIMESTRAL', 'ANUAL_ESTIMATIVA');

-- CreateEnum
CREATE TYPE "clientes"."NaturezaAtividade" AS ENUM ('SERVICO', 'COMERCIO', 'MISTA');

-- AlterTable
ALTER TABLE "clientes"."Empresa" ADD COLUMN     "contribuinteIcms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contribuinteIpi" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contribuinteIss" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lucroRealApuracao" "clientes"."LucroRealApuracao",
ADD COLUMN     "naturezaAtividade" "clientes"."NaturezaAtividade",
ADD COLUMN     "possuiAntecipacaoTributaria" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiAutonomosRpa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiCprb" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiDifal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiEmpregados" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiIcmsSt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiProLabore" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiRetencaoInss" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiRetencaoIss" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiRetencoesFederais" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiSstObrigatorio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regimeTributario" "clientes"."RegimeTributario",
ADD COLUMN     "sujeitoFatorR" BOOLEAN NOT NULL DEFAULT false;
