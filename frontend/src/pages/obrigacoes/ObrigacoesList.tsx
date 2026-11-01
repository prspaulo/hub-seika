import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, useApiClient } from "../../lib/useApiClient";
import { useEmpresas, useAssignableUsers } from "../../lib/useReferenceData";
import { formatDate, STATUS_LABEL, STATUS_ORDER, type Obrigacao, type StatusTarefa } from "../../types/processo";

type ListResponse = { items: Obrigacao[]; total: number };

const EMPTY_FORM = { titulo: "", empresaId: "", owner: "", prazo: "", notas: "" };

export function ObrigacoesList() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { data: empresas } = useEmpresas();
  const { data: users } = useAssignableUsers();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["obrigacoes", search],
    queryFn: () =>
      api.get(
        `/api/v1/obrigacoes${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      ) as Promise<ListResponse>,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["obrigacoes"] });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/v1/obrigacoes", {
        titulo: form.titulo,
        owner: form.owner,
        prazo: form.prazo,
        ...(form.empresaId ? { empresaId: form.empresaId } : {}),
        ...(form.notas ? { notas: form.notas } : {}),
      }),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusTarefa }) =>
      api.patch(`/api/v1/obrigacoes/${id}`, { status }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/v1/obrigacoes/${id}`),
    onSuccess: invalidate,
  });

  function empresaNome(id: string | null) {
    if (!id) return "Interna / sem cliente";
    return empresas?.items.find((e) => e.id === id)?.razaoSocial ?? "—";
  }
  function ownerNome(id: string) {
    return users?.find((u) => u.id === id)?.name ?? "—";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao cadastrar obrigação.");
    }
  }

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">ROTINA E CONFORMIDADE</span>
          <h1>Obrigações</h1>
          <p>Cadastre o que precisa ser entregue. Cada ação mantém autor, data e hora.</p>
        </div>
      </div>

      <input
        className="search-input"
        placeholder="Pesquisar obrigações"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {isLoading && <p>Carregando...</p>}

      {data && data.items.length > 0 && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Cliente</th>
                <th>Responsável</th>
                <th>Prazo</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((obrigacao) => (
                <tr key={obrigacao.id}>
                  <td>{obrigacao.titulo}</td>
                  <td>{empresaNome(obrigacao.empresaId)}</td>
                  <td>{ownerNome(obrigacao.owner)}</td>
                  <td>{formatDate(obrigacao.prazo)}</td>
                  <td>
                    <select
                      value={obrigacao.status}
                      onChange={(event) =>
                        statusMutation.mutate({
                          id: obrigacao.id,
                          status: event.target.value as StatusTarefa,
                        })
                      }
                    >
                      {STATUS_ORDER.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="quiet" onClick={() => deleteMutation.mutate(obrigacao.id)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.items.length === 0 && <p className="empty">Nenhuma obrigação cadastrada.</p>}

      <div className="card">
        <h3>+ Obrigação</h3>
        <form className="formgrid" onSubmit={handleSubmit}>
          <label className="wide">
            Título
            <input required value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} />
          </label>
          <label>
            Cliente
            <select value={form.empresaId} onChange={(e) => setForm((p) => ({ ...p, empresaId: e.target.value }))}>
              <option value="">Interna / sem cliente</option>
              {empresas?.items.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razaoSocial}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsável
            <select required value={form.owner} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))}>
              <option value="">Selecione...</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prazo
            <input
              required
              type="date"
              value={form.prazo}
              onChange={(e) => setForm((p) => ({ ...p, prazo: e.target.value }))}
            />
          </label>
          <label className="wide">
            O que precisa ser entregue
            <textarea value={form.notas} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))} />
          </label>
          {error && <p className="form-error wide">{error}</p>}
          <div className="wide">
            <button type="submit" className="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "+ Obrigação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
