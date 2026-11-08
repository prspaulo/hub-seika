import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, useApiClient } from "../../lib/useApiClient";
import { useAssignableUsers } from "../../lib/useReferenceData";
import { REGIME_TRIBUTARIO_LABEL, NATUREZA_ATIVIDADE_LABEL, type NaturezaAtividade, type RegimeTributario } from "../../types/empresa";
import { SETOR_LABEL, type ResponsavelDepartamento, type Setor } from "../../types/processo";
import {
  CARACTERISTICAS_TEMPLATE,
  MESES_LABEL,
  PERIODICIDADE_LABEL,
  type CaracteristicaTemplateKey,
  type ObrigacaoTemplate,
  type Periodicidade,
} from "../../types/obrigacaoTemplate";

const REGIMES: RegimeTributario[] = ["SIMPLES_NACIONAL", "LUCRO_PRESUMIDO", "LUCRO_REAL"];
const ATIVIDADES: NaturezaAtividade[] = ["SERVICO", "COMERCIO", "MISTA"];
const DEPARTAMENTOS: Setor[] = ["FISCAL", "DEPARTAMENTO_PESSOAL", "CONTABIL", "LEGALIZACAO"];
const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

type FormState = {
  codigo: string;
  nome: string;
  grupo: string;
  departamento: Setor;
  periodicidade: Periodicidade;
  regraCompetencia: string;
  prazoLegalMesesApos: string;
  prazoLegalDia: string;
  prazoLegalDescricao: string;
  prazoInternoDiasAntes: string;
  geraGuia: boolean;
  dependencia: string;
  observacoes: string;
  ativo: boolean;
};

const EMPTY_FORM: FormState = {
  codigo: "",
  nome: "",
  grupo: "",
  departamento: "FISCAL",
  periodicidade: "MENSAL",
  regraCompetencia: "",
  prazoLegalMesesApos: "1",
  prazoLegalDia: "20",
  prazoLegalDescricao: "",
  prazoInternoDiasAntes: "5",
  geraGuia: false,
  dependencia: "",
  observacoes: "",
  ativo: false,
};

const EMPTY_REGIMES = Object.fromEntries(REGIMES.map((r) => [r, false])) as Record<RegimeTributario, boolean>;
const EMPTY_ATIVIDADES = Object.fromEntries(ATIVIDADES.map((a) => [a, false])) as Record<NaturezaAtividade, boolean>;
const EMPTY_MESES = Object.fromEntries(MESES.map((m) => [m, m <= 12])) as Record<number, boolean>;
const EMPTY_CARACTERISTICAS = Object.fromEntries(CARACTERISTICAS_TEMPLATE.map((c) => [c.key, false])) as Record<
  CaracteristicaTemplateKey,
  boolean
>;

export function ObrigacaoTemplatesPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { data: users } = useAssignableUsers();
  const { data: responsaveis } = useQuery({
    queryKey: ["responsaveis-departamento"],
    queryFn: () => api.get("/api/v1/obrigacoes/responsaveis-departamento") as Promise<ResponsavelDepartamento[]>,
  });
  const setResponsavelMutation = useMutation({
    mutationFn: ({ departamento, ownerId }: { departamento: Setor; ownerId: string }) =>
      ownerId
        ? api.put(`/api/v1/obrigacoes/responsaveis-departamento/${departamento}`, { ownerId })
        : api.del(`/api/v1/obrigacoes/responsaveis-departamento/${departamento}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["responsaveis-departamento"] }),
  });
  function responsavelDe(departamento: Setor) {
    return responsaveis?.find((r) => r.departamento === departamento)?.ownerId ?? "";
  }

  const [filtroRegime, setFiltroRegime] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [regimes, setRegimes] = useState(EMPTY_REGIMES);
  const [atividades, setAtividades] = useState(EMPTY_ATIVIDADES);
  const [meses, setMeses] = useState(EMPTY_MESES);
  const [exigeMovimento, setExigeMovimento] = useState(false);
  const [caracteristicas, setCaracteristicas] = useState(EMPTY_CARACTERISTICAS);
  const [error, setError] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["obrigacao-templates", filtroRegime],
    queryFn: () => {
      const qs = filtroRegime ? `?regime=${filtroRegime}` : "";
      return api.get(`/api/v1/obrigacoes/templates${qs}`) as Promise<ObrigacaoTemplate[]>;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["obrigacao-templates"] });

  function resetForm() {
    setForm(EMPTY_FORM);
    setRegimes(EMPTY_REGIMES);
    setAtividades(EMPTY_ATIVIDADES);
    setMeses(EMPTY_MESES);
    setExigeMovimento(false);
    setCaracteristicas(EMPTY_CARACTERISTICAS);
    setEditingId(null);
  }

  function startEdit(t: ObrigacaoTemplate) {
    setForm({
      codigo: t.codigo,
      nome: t.nome,
      grupo: t.grupo,
      departamento: t.departamento,
      periodicidade: t.periodicidade,
      regraCompetencia: t.regraCompetencia ?? "",
      prazoLegalMesesApos: String(t.prazoLegalMesesApos),
      prazoLegalDia: String(t.prazoLegalDia),
      prazoLegalDescricao: t.prazoLegalDescricao ?? "",
      prazoInternoDiasAntes: String(t.prazoInternoDiasAntes),
      geraGuia: t.geraGuia,
      dependencia: t.dependencia ?? "",
      observacoes: t.observacoes ?? "",
      ativo: t.ativo,
    });
    setRegimes({
      ...EMPTY_REGIMES,
      ...Object.fromEntries(t.regimesAplicaveis.map((r) => [r, true])),
    });
    setAtividades({
      ...EMPTY_ATIVIDADES,
      ...Object.fromEntries(t.atividadesAplicaveis.map((a) => [a, true])),
    });
    setMeses({
      ...Object.fromEntries(MESES.map((m) => [m, false])),
      ...Object.fromEntries(t.mesesCompetencia.map((m) => [m, true])),
    });
    setExigeMovimento(t.exigeMovimento);
    setCaracteristicas(
      Object.fromEntries(CARACTERISTICAS_TEMPLATE.map((c) => [c.key, t[c.key]])) as Record<
        CaracteristicaTemplateKey,
        boolean
      >,
    );
    setEditingId(t.id);
    setShowForm(true);
  }

  function buildPayload() {
    return {
      codigo: form.codigo,
      nome: form.nome,
      grupo: form.grupo,
      departamento: form.departamento,
      regimesAplicaveis: REGIMES.filter((r) => regimes[r]),
      atividadesAplicaveis: ATIVIDADES.filter((a) => atividades[a]),
      periodicidade: form.periodicidade,
      mesesCompetencia: MESES.filter((m) => meses[m]),
      ...(form.regraCompetencia ? { regraCompetencia: form.regraCompetencia } : {}),
      prazoLegalMesesApos: Number(form.prazoLegalMesesApos),
      prazoLegalDia: Number(form.prazoLegalDia),
      ...(form.prazoLegalDescricao ? { prazoLegalDescricao: form.prazoLegalDescricao } : {}),
      prazoInternoDiasAntes: Number(form.prazoInternoDiasAntes),
      exigeMovimento,
      ...caracteristicas,
      geraGuia: form.geraGuia,
      ...(form.dependencia ? { dependencia: form.dependencia } : {}),
      ...(form.observacoes ? { observacoes: form.observacoes } : {}),
      ativo: form.ativo,
    };
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      editingId ? api.patch(`/api/v1/obrigacoes/templates/${editingId}`, buildPayload()) : api.post("/api/v1/obrigacoes/templates", buildPayload()),
    onSuccess: () => {
      resetForm();
      setShowForm(false);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/v1/obrigacoes/templates/${id}`),
    onSuccess: invalidate,
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      api.patch(`/api/v1/obrigacoes/templates/${id}`, { ativo }),
    onSuccess: invalidate,
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await saveMutation.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar template.");
    }
  }

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">MOTOR DE OBRIGAÇÕES</span>
          <h1>Catálogo de obrigações</h1>
          <p>
            Regras da Cartilha de Obrigações — cada template vira obrigação real quando a empresa
            parametrizada combina com o regime/atividade/características exigidos.
          </p>
        </div>
        <button
          type="button"
          className="primary-link"
          onClick={() => {
            resetForm();
            setShowForm((v) => !v);
          }}
        >
          + Novo template
        </button>
      </div>

      <div className="notice warn">
        Prazos legais aqui são uma referência operacional (dia-base + meses após a competência), não um
        calendário fiscal completo com feriados/UF/município. Confira sempre conforme a legislação vigente
        antes de confiar cegamente num prazo gerado pelo motor.
      </div>

      <div className="card">
        <h3>Responsável padrão por departamento</h3>
        <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
          Quando configurado, o motor usa este responsável automaticamente ao gerar obrigações desse
          departamento — o "Responsável padrão" escolhido na hora de gerar vale só pros departamentos sem
          responsável definido aqui. Obrigações já geradas não são alteradas retroativamente.
        </p>
        <div className="formgrid">
          {DEPARTAMENTOS.map((d) => (
            <label key={d}>
              {SETOR_LABEL[d]}
              <select
                value={responsavelDe(d)}
                onChange={(e) => setResponsavelMutation.mutate({ departamento: d, ownerId: e.target.value })}
              >
                <option value="">Sem padrão (usa o responsável escolhido na geração)</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      {showForm && (
        <form className="card formgrid" onSubmit={handleSubmit}>
          <label>
            Código
            <input required value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} />
          </label>
          <label>
            Nome
            <input required value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
          </label>
          <label>
            Grupo (como na cartilha: Federal, Estadual, Municipal...)
            <input required value={form.grupo} onChange={(e) => setForm((p) => ({ ...p, grupo: e.target.value }))} />
          </label>
          <label>
            Departamento responsável
            <select value={form.departamento} onChange={(e) => setForm((p) => ({ ...p, departamento: e.target.value as Setor }))}>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>
                  {SETOR_LABEL[d]}
                </option>
              ))}
            </select>
          </label>

          <div className="wide">
            <h3 style={{ margin: "8px 0" }}>Regimes aplicáveis</h3>
          </div>
          <div className="wide" style={{ display: "flex", gap: 16 }}>
            {REGIMES.map((r) => (
              <label key={r} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  style={{ width: "auto", margin: 0 }}
                  checked={regimes[r]}
                  onChange={(e) => setRegimes((p) => ({ ...p, [r]: e.target.checked }))}
                />
                {REGIME_TRIBUTARIO_LABEL[r]}
              </label>
            ))}
          </div>

          <div className="wide">
            <h3 style={{ margin: "8px 0" }}>Atividades aplicáveis</h3>
          </div>
          <div className="wide" style={{ display: "flex", gap: 16 }}>
            {ATIVIDADES.map((a) => (
              <label key={a} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  style={{ width: "auto", margin: 0 }}
                  checked={atividades[a]}
                  onChange={(e) => setAtividades((p) => ({ ...p, [a]: e.target.checked }))}
                />
                {NATUREZA_ATIVIDADE_LABEL[a]}
              </label>
            ))}
          </div>

          <div className="wide">
            <h3 style={{ margin: "8px 0" }}>Periodicidade e competência</h3>
          </div>
          <label>
            Periodicidade
            <select
              value={form.periodicidade}
              onChange={(e) => setForm((p) => ({ ...p, periodicidade: e.target.value as Periodicidade }))}
            >
              {Object.entries(PERIODICIDADE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Regra de competência (texto livre)
            <input
              placeholder="Ex: Mês anterior"
              value={form.regraCompetencia}
              onChange={(e) => setForm((p) => ({ ...p, regraCompetencia: e.target.value }))}
            />
          </label>
          <div className="wide">
            <span className="muted">Meses em que a competência fecha (EVENTUAL pode deixar tudo desmarcado)</span>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              {MESES.map((m) => (
                <label key={m} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="checkbox"
                    style={{ width: "auto", margin: 0 }}
                    checked={meses[m]}
                    onChange={(e) => setMeses((p) => ({ ...p, [m]: e.target.checked }))}
                  />
                  {MESES_LABEL[m]}
                </label>
              ))}
            </div>
          </div>

          <div className="wide">
            <h3 style={{ margin: "8px 0" }}>Prazos</h3>
          </div>
          <label>
            Prazo legal — meses após a competência
            <input
              type="number"
              min="0"
              value={form.prazoLegalMesesApos}
              onChange={(e) => setForm((p) => ({ ...p, prazoLegalMesesApos: e.target.value }))}
            />
          </label>
          <label>
            Prazo legal — dia do mês
            <input
              type="number"
              min="1"
              max="31"
              value={form.prazoLegalDia}
              onChange={(e) => setForm((p) => ({ ...p, prazoLegalDia: e.target.value }))}
            />
          </label>
          <label>
            Prazo legal — descrição (quando dia+offset não é suficiente)
            <input
              placeholder='Ex: "último dia útil"'
              value={form.prazoLegalDescricao}
              onChange={(e) => setForm((p) => ({ ...p, prazoLegalDescricao: e.target.value }))}
            />
          </label>
          <label>
            Prazo interno Seika — dias antes do prazo legal
            <input
              type="number"
              min="0"
              value={form.prazoInternoDiasAntes}
              onChange={(e) => setForm((p) => ({ ...p, prazoInternoDiasAntes: e.target.value }))}
            />
          </label>

          <div className="wide">
            <h3 style={{ margin: "8px 0" }}>Condições de habilitação</h3>
            <p className="muted" style={{ marginTop: -6, marginBottom: 10 }}>
              Só marque o que esta obrigação exige da empresa — o motor cruza com as características
              fiscais do cadastro.
            </p>
          </div>
          <div className="wide" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <input
              type="checkbox"
              style={{ width: "auto", margin: 0 }}
              checked={exigeMovimento}
              onChange={(e) => setExigeMovimento(e.target.checked)}
            />
            Verifica "sem movimento" (não some automaticamente se a empresa não tiver movimento no período)
          </div>
          <div className="wide" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 16px" }}>
            {CARACTERISTICAS_TEMPLATE.map((c) => (
              <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  style={{ width: "auto", margin: 0 }}
                  checked={caracteristicas[c.key]}
                  onChange={(e) => setCaracteristicas((p) => ({ ...p, [c.key]: e.target.checked }))}
                />
                {c.label}
              </label>
            ))}
          </div>

          <div className="wide">
            <h3 style={{ margin: "8px 0" }}>Outros</h3>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              style={{ width: "auto", margin: 0 }}
              checked={form.geraGuia}
              onChange={(e) => setForm((p) => ({ ...p, geraGuia: e.target.checked }))}
            />
            Gera guia de pagamento
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              style={{ width: "auto", margin: 0 }}
              checked={form.ativo}
              onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
            />
            Ativo (entra no motor de geração)
          </label>
          <label className="wide">
            Dependência
            <input
              placeholder="Ex: faturamento fechado"
              value={form.dependencia}
              onChange={(e) => setForm((p) => ({ ...p, dependencia: e.target.value }))}
            />
          </label>
          <label className="wide">
            Observações
            <textarea value={form.observacoes} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))} />
          </label>

          {error && <p className="form-error wide">{error}</p>}
          <div className="wide" style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar alterações" : "Criar template"}
            </button>
            <button
              type="button"
              className="quiet"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <select value={filtroRegime} onChange={(e) => setFiltroRegime(e.target.value)}>
          <option value="">Todos os regimes</option>
          {REGIMES.map((r) => (
            <option key={r} value={r}>
              {REGIME_TRIBUTARIO_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Carregando...</p>}
      {!isLoading && templates?.length === 0 && <p className="empty">Nenhum template cadastrado ainda.</p>}

      {templates && templates.length > 0 && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Grupo / Depto</th>
                <th>Regimes</th>
                <th>Periodicidade</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>{t.codigo}</td>
                  <td>{t.nome}</td>
                  <td>
                    {t.grupo} <span className="muted">· {SETOR_LABEL[t.departamento]}</span>
                  </td>
                  <td>{t.regimesAplicaveis.map((r) => REGIME_TRIBUTARIO_LABEL[r as RegimeTributario]).join(", ")}</td>
                  <td>{PERIODICIDADE_LABEL[t.periodicidade]}</td>
                  <td>
                    <button
                      type="button"
                      className={`badge ${t.ativo ? "ativa" : "inativa"}`}
                      style={{ border: 0, cursor: "pointer" }}
                      onClick={() => toggleAtivoMutation.mutate({ id: t.id, ativo: !t.ativo })}
                    >
                      {t.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="quiet" onClick={() => startEdit(t)}>
                      Editar
                    </button>
                    <button type="button" className="quiet" onClick={() => deleteMutation.mutate(t.id)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
