import { NotFoundError } from "../../shared/errors.js";
import { acervoRepository } from "./repository.js";
import type { CreateMaterialInput, ListMateriaisQuery, UpdateMaterialInput } from "./types.js";

export const acervoService = {
  list(query: ListMateriaisQuery) {
    return acervoRepository.list(query);
  },

  async listAreas() {
    const rows = await acervoRepository.listAreas();
    return rows.map((r) => r.area).sort();
  },

  async getById(id: string) {
    const material = await acervoRepository.findById(id);
    if (!material) throw new NotFoundError("Material");
    return material;
  },

  create(input: CreateMaterialInput, actorId: string) {
    return acervoRepository.create({ ...input, createdBy: actorId });
  },

  async update(id: string, input: UpdateMaterialInput) {
    await this.getById(id);
    return acervoRepository.update(id, input);
  },

  async delete(id: string) {
    await this.getById(id);
    await acervoRepository.delete(id);
  },
};
