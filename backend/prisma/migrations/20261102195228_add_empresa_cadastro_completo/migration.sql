-- CreateEnum
CREATE TYPE "clientes"."RegimeTributario" AS ENUM ('MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- AlterTable
ALTER TABLE "clientes"."Empresa" ADD COLUMN     "capitalSocialCentavos" INTEGER,
ADD COLUMN     "certificadoDigitalUrl" TEXT,
ADD COLUMN     "certificadoDigitalVencimento" TIMESTAMP(3),
ADD COLUMN     "clienteDesde" TIMESTAMP(3),
ADD COLUMN     "enderecoBairro" TEXT,
ADD COLUMN     "enderecoCep" TEXT,
ADD COLUMN     "enderecoCidade" TEXT,
ADD COLUMN     "enderecoComplemento" TEXT,
ADD COLUMN     "enderecoLogradouro" TEXT,
ADD COLUMN     "enderecoNumero" TEXT,
ADD COLUMN     "enderecoUf" TEXT,
ADD COLUMN     "regimeTributario" "clientes"."RegimeTributario",
ADD COLUMN     "temFilial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipoAtividade" TEXT;

-- CreateTable
CREATE TABLE "clientes"."SocioAdministrador" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocioAdministrador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes"."Filial" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "enderecoLogradouro" TEXT,
    "enderecoNumero" TEXT,
    "enderecoComplemento" TEXT,
    "enderecoBairro" TEXT,
    "enderecoCidade" TEXT,
    "enderecoUf" TEXT,
    "enderecoCep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Filial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocioAdministrador_empresaId_idx" ON "clientes"."SocioAdministrador"("empresaId");

-- CreateIndex
CREATE INDEX "Filial_empresaId_idx" ON "clientes"."Filial"("empresaId");

-- AddForeignKey
ALTER TABLE "clientes"."SocioAdministrador" ADD CONSTRAINT "SocioAdministrador_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "clientes"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes"."Filial" ADD CONSTRAINT "Filial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "clientes"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
