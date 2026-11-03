import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, useApiClient } from "../../lib/useApiClient";
import { useEmpresas, useAssignableUsers } from "../../lib/useReferenceData";
import {
  ATRASO_LABEL,
  formatDate,
  obrigacaoAtraso,
  SETOR_LABEL,
  STATUS_OBRIGACAO_LABEL,
  STATUS_OBRIGACAO_ORDER,
  type Obrigacao,
  type Setor,
  type StatusObrigacao,
} from "../../types/processo";

type ListResponse = { items: Obrigacao[]; total: number };
type GerarResponse = { competencia: string; criadas: number; jaExistentes: number };

const DEPARTAMENTOS: Setor[] = ["FISCAL", "DEPARTAMENTO_PESSOAL", "CONTABIL", "LEGALIZACAO"];

const EMPTY_FORM = { titulo: "", empresaId: "", owner: "", prazo: "", notas: "" };

function competenciaAtual() {
  return new Date().toISOString().slice(0, 7);
}

const EMPTY_GERAR_FORM = { competencia: competenciaAtual(), ownerId: "", empresaId: "" };

export function ObrigacoesList() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { data: empresas } = useEmpresas();
  const { data: users } = useAssignableUsers();
  const [search, setSearch] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroCompetencia, setFiltroCompetencia] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [showGerarForm, setShowGerarForm] = useState(false);
  const [gerarForm, setGerarForm] = useState(EMPTY_GERAR_FORM);
  const [gerarResultado, setGerarResultado] = useState<GerarResponse | null>(null);
  const [gerarError, setGerarError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["obrigacoes", search, filtroDepartamento, filtroCompetencia, filtroStatus],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: "200" });
      if (search) params.set("search", search);
      if (filtroDepartamento) params.set("departamento", filtroDepartamento);
      if (filtroCompetencia) params.set("competencia", filtroCompetencia);
      if (filtroStatus) params.set("status", filtroStatus);
      return api.get(`/api/v1/obrigacoes?${params.toString()}`) as Promise<ListResponse>;
    },
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
    mutationFn: ({ id, status }: { id: string; status: StatusObrigacao }) =>
      api.patch(`/api/v1/obrigacoes/${id}`, { status }),
    onSuccess: invalidate,
  });

  const semMovimentoMutation = useMutation({
    mutationFn: ({ id, semMovimento }: { id: string; semMovimento: boolean }) =>
      api.patch(`/api/v1/obrigacoes/${id}`, { semMovimento }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/v1/obrigacoes/${id}`),
    onSuccess: invalidate,
  });

  const gerarMutation = useMutation({
    mutationFn: () =>
      api.post("/api/v1/obrigacoes/gerar", {
        ownerId: gerarForm.ownerId,
        ...(gerarForm.competencia ? { competencia: gerarForm.competencia } : {}),
        ...(gerarForm.empresaId ? { empresaId: gerarForm.empresaId } : {}),
      }) as Promise<GerarResponse>,
    onSuccess: (resultado) => {
      setGerarResultado(resultado);
      invalidate();
    },
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

  async function handleGerarSubmit(event: FormEvent) {
    event.preventDefault();
    setGerarError(null);
    setGerarResultado(null);
    try {
      await gerarMutation.mutateAsync();
    } catch (err) {
      setGerarError(err instanceof ApiError ? err.message : "Erro ao gerar obrigações.");
    }
  }

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">CENTRAL DE PRAZOS</span>
          <h1>Obrigações</h1>
          <p>Manuais e geradas pelo Motor de Obrigações — prazo interno Seika e prazo legal lado a lado.</p>
        </div>
        <button type="button" className="primary-link" onClick={() => setShowGerarForm((v) => !v)}>
          + Gerar obrigações do mês
        </button>
      </div>

      {showGerarForm && (
        <form className="card formgrid" onSubmit={handleGerarSubmit}>
          <label>
            Competência
            <input
              type="month"
              value={gerarForm.competencia}
              onChange={(e) => setGerarForm((p) => ({ ...p, competencia: e.target.value }))}
            />
          </label>
          <label>
            Responsável padrão
            <select
              required
              value={gerarForm.ownerId}
              onChange={(e) => setGerarForm((p) => ({ ...p, ownerId: e.target.value }))}
            >
              <option value="">Selecione...</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Empresa (opcional — vazio gera para todas as ativas)
            <select
              value={gerarForm.empresaId}
              onChange={(e) => setGerarForm((p) => ({ ...p, empresaId: e.target.value }))}
            >
              <option value="">Todas as empresas ativas</option>
              {empresas?.items.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razaoSocial}
                </option>
              ))}
            </select>
          </label>
          <p className="muted wide" style={{ marginTop: -6 }}>
            Cruza o regime/atividade/características de cada empresa com o catálogo ativo. Rodar de novo não
            duplica o que já foi gerado.
          </p>
          {gerarError && <p className="form-error wide">{gerarError}</p>}
          {gerarResultado && (
            <p className="wide" style={{ color: "var(--mint)", fontWeight: 600 }}>
              Competência {gerarResultado.competencia}: {gerarResultado.criadas} criada(s),{" "}
              {gerarResultado.jaExistentes} já existente(s).
            </p>
          )}
          <div className="wide" style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="primary" disabled={gerarMutation.isPending}>
              {gerarMutation.isPending ? "Gerando..." : "Gerar"}
            </button>
            <button type="button" className="quiet" onClick={() => setShowGerarForm(false)}>
              Fechar
            </button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          style={{ marginBottom: 0 }}
          placeholder="Pesquisar obrigações"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={filtroDepartamento} onChange={(e) => setFiltroDepartamento(e.target.value)}>
          <option value="">Todos os departamentos</option>
          {DEPARTAMENTOS.map((d) => (
            <option key={d} value={d}>
              {SETOR_LABEL[d]}
            </option>
          ))}
        </select>
        <input
          type="month"
          value={filtroCompetencia}
          onChange={(e) => setFiltroCompetencia(e.target.value)}
          title="Filtrar por competência"
        />
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todas as situações</option>
          {STATUS_OBRIGACAO_ORDER.map((status) => (
            <option key={status} value={status}>
              {STATUS_OBRIGACAO_LABEL[status]}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Carregando...</p>}

      {data && data.items.length > 0 && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Cliente</th>
                <th>Depto</th>
                <th>Competência</th>
                <th>Responsável</th>
                <th>Prazo interno</th>
                <th>Prazo legal</th>
                <th>Situação</th>
                <th>Sem movimento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((obrigacao) => {
                const atraso = obrigacaoAtraso(obrigacao);
                return (
                  <tr key={obrigacao.id}>
                    <td>
                      {obrigacao.titulo}
                      {obrigacao.templateId && <div className="muted">Gerada pelo motor</div>}
                    </td>
                    <td>{empresaNome(obrigacao.empresaId)}</td>
                    <td>{obrigacao.departamento ? SETOR_LABEL[obrigacao.departamento] : "—"}</td>
                    <td>{obrigacao.competencia ?? "—"}</td>
                    <td>{ownerNome(obrigacao.owner)}</td>
                    <td>{formatDate(obrigacao.prazo)}</td>
                    <td>{obrigacao.prazoLegal ? formatDate(obrigacao.prazoLegal) : "—"}</td>
                    <td>
                      <select
                        value={obrigacao.status}
                        onChange={(event) =>
                          statusMutation.mutate({
                            id: obrigacao.id,
                            status: event.target.value as StatusObrigacao,
                          })
                        }
                      >
                        {STATUS_OBRIGACAO_ORDER.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_OBRIGACAO_LABEL[status]}
                          </option>
                        ))}
                      </select>
                      {atraso && atraso !== "ok" && (
                        <div>
                          <span className={`badge ${atraso === "vencido_legal" ? "inativa" : "suspensa"}`}>
                            {ATRASO_LABEL[atraso]}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        style={{ width: "auto", margin: 0 }}
                        checked={obrigacao.semMovimento}
                        onChange={(event) =>
                          semMovimentoMutation.mutate({ id: obrigacao.id, semMovimento: event.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <button type="button" className="quiet" onClick={() => deleteMutation.mutate(obrigacao.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.items.length === 0 && <p className="empty">Nenhuma obrigação encontrada.</p>}

      <div className="card">
        <h3>+ Obrigação manual</h3>
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
