-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "clientes";

-- CreateEnum
CREATE TYPE "clientes"."EmpresaStatus" AS ENUM ('ATIVA', 'INATIVA', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "clientes"."LicencaStatus" AS ENUM ('VALIDA', 'VENCIDA', 'EM_RENOVACAO');

-- CreateTable
CREATE TABLE "clientes"."Empresa" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "status" "clientes"."EmpresaStatus" NOT NULL DEFAULT 'ATIVA',
    "email" TEXT,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes"."Licenca" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT,
    "status" "clientes"."LicencaStatus" NOT NULL DEFAULT 'VALIDA',
    "validade" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Licenca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "clientes"."Empresa"("cnpj");

-- CreateIndex
CREATE INDEX "Licenca_empresaId_idx" ON "clientes"."Licenca"("empresaId");

-- AddForeignKey
ALTER TABLE "clientes"."Licenca" ADD CONSTRAINT "Licenca_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "clientes"."Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
