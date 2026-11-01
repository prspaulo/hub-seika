import { empresasService } from "../clientes/service.js";
import { toCentavos } from "../../shared/money.js";
import { mensalidadesRepository } from "./repository.js";
import type { MensalidadeInput } from "./types.js";

export const mensalidadesService = {
  getByEmpresa(empresaId: string) {
    return mensalidadesRepository.findByEmpresa(empresaId);
  },

  listAtivas() {
    return mensalidadesRepository.listAtivas();
  },

  async upsert(empresaId: string, input: MensalidadeInput) {
    await empresasService.getById(empresaId);
    return mensalidadesRepository.upsert(empresaId, {
      valorCentavos: toCentavos(input.valor),
      diaVencimento: input.diaVencimento,
      ativaDesde: input.ativaDesde,
      ativo: input.ativo,
    });
  },
};
