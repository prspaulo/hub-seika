-- CreateEnum
CREATE TYPE "clientes"."NaturezaJuridica" AS ENUM ('LTDA', 'SA', 'EI', 'SOCIEDADE_SIMPLES', 'MEI', 'COOPERATIVA', 'ASSOCIACAO');

-- CreateEnum
CREATE TYPE "clientes"."PorteEmpresa" AS ENUM ('ME', 'EPP', 'DEMAIS');

-- CreateEnum
CREATE TYPE "clientes"."OrgaoRegistro" AS ENUM ('OAB', 'JUNTA_COMERCIAL', 'CARTORIO');

-- AlterTable
ALTER TABLE "clientes"."Empresa" DROP COLUMN "regimeTributario",
ADD COLUMN     "inscricaoEstadual" TEXT,
ADD COLUMN     "inscricaoMunicipal" TEXT,
ADD COLUMN     "naturezaJuridica" "clientes"."NaturezaJuridica",
ADD COLUMN     "nire" TEXT,
ADD COLUMN     "orgaoRegistro" "clientes"."OrgaoRegistro",
ADD COLUMN     "porte" "clientes"."PorteEmpresa";

-- AlterTable
ALTER TABLE "clientes"."Filial" ALTER COLUMN "cnpj" SET NOT NULL;

-- DropEnum
DROP TYPE "clientes"."RegimeTributario";

-- CreateIndex
CREATE UNIQUE INDEX "Filial_cnpj_key" ON "clientes"."Filial"("cnpj");
