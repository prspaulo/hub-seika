-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "acervo";

-- CreateEnum
CREATE TYPE "acervo"."TipoMaterial" AS ENUM ('LIVRO', 'VIDEO', 'DOCUMENTO', 'FOTO', 'PLANILHA', 'APRESENTACAO', 'SITE');

-- CreateTable
CREATE TABLE "acervo"."MaterialAcervo" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "tipo" "acervo"."TipoMaterial" NOT NULL DEFAULT 'DOCUMENTO',
    "categoria" TEXT,
    "url" TEXT NOT NULL,
    "descricao" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialAcervo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialAcervo_area_idx" ON "acervo"."MaterialAcervo"("area");
