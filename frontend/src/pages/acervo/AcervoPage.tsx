import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, useApiClient } from "../../lib/useApiClient";
import { AREA_SUGESTOES, TIPO_MATERIAL_LABEL, type MaterialAcervo, type TipoMaterial } from "../../types/acervo";

const EMPTY_FORM = {
  titulo: "",
  area: "",
  tipo: "DOCUMENTO" as TipoMaterial,
  categoria: "",
  url: "",
  descricao: "",
};

export function AcervoPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [areaFiltro, setAreaFiltro] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data: materiais, isLoading } = useQuery({
    queryKey: ["acervo", search, areaFiltro],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (areaFiltro) params.set("area", areaFiltro);
      const qs = params.toString();
      return api.get(`/api/v1/acervo${qs ? `?${qs}` : ""}`) as Promise<MaterialAcervo[]>;
    },
  });

  const { data: areas } = useQuery({
    queryKey: ["acervo-areas"],
    queryFn: () => api.get("/api/v1/acervo/areas") as Promise<string[]>,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/v1/acervo", {
        titulo: form.titulo,
        area: form.area,
        tipo: form.tipo,
        ...(form.categoria ? { categoria: form.categoria } : {}),
        url: form.url,
        ...(form.descricao ? { descricao: form.descricao } : {}),
      }),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["acervo"] });
      queryClient.invalidateQueries({ queryKey: ["acervo-areas"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/v1/acervo/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["acervo"] }),
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar material.");
    }
  }

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">APRENDER PARA EVOLUIR</span>
          <h1>Academia e Acervo</h1>
          <p>Biblioteca de materiais e links (geralmente do Drive da equipe), organizada por área.</p>
        </div>
        <button type="button" className="primary-link" onClick={() => setShowForm((v) => !v)}>
          + Link / material externo
        </button>
      </div>

      <div className="notice">
        O sistema guarda só o título e o link — o arquivo em si continua no Google Drive da equipe. Envie o
        material lá normalmente e cole o link aqui.
      </div>

      {showForm && (
        <form className="card formgrid" onSubmit={handleSubmit}>
          <label>
            Título
            <input required value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} />
          </label>
          <label>
            Área
            <input
              required
              list="areas-sugestoes"
              value={form.area}
              onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
            />
            <datalist id="areas-sugestoes">
              {AREA_SUGESTOES.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </label>
          <label>
            Tipo
            <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as TipoMaterial }))}>
              {Object.entries(TIPO_MATERIAL_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoria / coleção
            <input value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))} />
          </label>
          <label className="wide">
            Link do material (Drive, site, etc.)
            <input
              required
              type="url"
              placeholder="https://drive.google.com/..."
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            />
          </label>
          <label className="wide">
            Observações
            <textarea value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
          </label>
          {error && <p className="form-error wide">{error}</p>}
          <div className="wide" style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Salvar material"}
            </button>
            <button type="button" className="quiet" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          style={{ marginBottom: 0 }}
          placeholder="Buscar título ou categoria"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}>
          <option value="">Todas as áreas</option>
          {areas?.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Carregando...</p>}
      {!isLoading && materiais?.length === 0 && <p className="empty">Nenhum material cadastrado ainda.</p>}

      <div className="cards-grid">
        {materiais?.map((material) => (
          <div key={material.id} className="material-card">
            <strong>{material.titulo}</strong>
            <div className="row">
              <span className="badge">{material.area}</span>
              <span className="badge">{TIPO_MATERIAL_LABEL[material.tipo]}</span>
            </div>
            {material.categoria && <p className="muted">{material.categoria}</p>}
            {material.descricao && <p className="muted">{material.descricao}</p>}
            <div className="row" style={{ marginTop: "auto" }}>
              <a href={material.url} target="_blank" rel="noreferrer" className="quiet-link">
                Abrir ↗
              </a>
              <button type="button" className="quiet" onClick={() => deleteMutation.mutate(material.id)}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
