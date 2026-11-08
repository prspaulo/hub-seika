-- CreateTable
CREATE TABLE "processos"."ResponsavelDepartamento" (
    "departamento" "processos"."Setor" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsavelDepartamento_pkey" PRIMARY KEY ("departamento")
);
