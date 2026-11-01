import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, useApiClient } from "../../lib/useApiClient";
import { useEmpresas } from "../../lib/useReferenceData";
import {
  STATUS_COMPUTADO_LABEL,
  TIPO_LABEL,
  type Cobranca,
  type Despesa,
  type FormaPagamento,
  type Resumo,
  type SaidaCliente,
} from "../../types/financeiro";

type Tab = "overview" | "monthly" | "occasional" | "late" | "expenses" | "departures";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Todas as cobranças" },
  { key: "monthly", label: "Mensalidades" },
  { key: "occasional", label: "Serviços esporádicos" },
  { key: "late", label: "Atrasados" },
  { key: "expenses", label: "Despesas" },
  { key: "departures", label: "Saídas de clientes" },
];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function FinanceiroPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { data: empresas } = useEmpresas();
  const [tab, setTab] = useState<Tab>("overview");
  const [acao, setAcao] = useState<{ id: string; tipo: "pagar" | "estornar" } | null>(null);
  const [showLancamento, setShowLancamento] = useState(false);
  const [showDespesa, setShowDespesa] = useState(false);

  const { data: resumo } = useQuery({
    queryKey: ["financeiro-resumo"],
    queryFn: () => api.get("/api/v1/financeiro/resumo") as Promise<Resumo>,
  });

  const { data: cobrancas, isLoading } = useQuery({
    queryKey: ["financeiro-cobrancas"],
    queryFn: () => api.get("/api/v1/financeiro/cobrancas?pageSize=200") as Promise<{ items: Cobranca[] }>,
    enabled: tab !== "expenses" && tab !== "departures",
  });

  const { data: despesas } = useQuery({
    queryKey: ["financeiro-despesas"],
    queryFn: () => api.get("/api/v1/financeiro/despesas") as Promise<Despesa[]>,
    enabled: tab === "expenses",
  });

  const { data: saidas } = useQuery({
    queryKey: ["financeiro-saidas"],
    queryFn: () => api.get("/api/v1/financeiro/saidas-clientes") as Promise<SaidaCliente[]>,
    enabled: tab === "departures",
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["financeiro-resumo"] });
    queryClient.invalidateQueries({ queryKey: ["financeiro-cobrancas"] });
    queryClient.invalidateQueries({ queryKey: ["financeiro-despesas"] });
    queryClient.invalidateQueries({ queryKey: ["financeiro-saidas"] });
  };

  const empresaNome = (id: string) => empresas?.items.find((e) => e.id === id)?.razaoSocial ?? "—";

  const itemsFiltrados = (cobrancas?.items ?? []).filter((c) => {
    if (tab === "monthly") return c.tipo === "MENSAL";
    if (tab === "occasional") return c.tipo !== "MENSAL";
    if (tab === "late") return c.statusComputado === "ATRASADO";
    return true;
  });

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">FINANÇAS</span>
          <h1>Financeiro</h1>
          <p>Mensalidades, serviços e despesas com origem rastreável.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="quiet" onClick={() => setShowDespesa((v) => !v)}>
            + Despesa
          </button>
          <button type="button" className="primary-link" onClick={() => setShowLancamento((v) => !v)}>
            + Lançamento
          </button>
        </div>
      </div>

      {resumo && (
        <div className="formgrid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 18 }}>
          <div className="card">
            <h3>Recebido</h3>
            <strong style={{ fontSize: 22 }}>{formatMoney(resumo.recebido)}</strong>
          </div>
          <div className="card">
            <h3>A receber</h3>
            <strong style={{ fontSize: 22 }}>{formatMoney(resumo.aReceber)}</strong>
          </div>
          <div className="card">
            <h3>Atrasado</h3>
            <strong style={{ fontSize: 22, color: "var(--red)" }}>{formatMoney(resumo.atrasado)}</strong>
          </div>
          <div className="card">
            <h3>Despesas pagas</h3>
            <strong style={{ fontSize: 22 }}>{formatMoney(resumo.despesasPagas)}</strong>
          </div>
        </div>
      )}

      {showLancamento && (
        <NovoLancamentoForm
          onClose={() => setShowLancamento(false)}
          onSaved={() => {
            setShowLancamento(false);
            invalidateAll();
          }}
        />
      )}
      {showDespesa && (
        <NovaDespesaForm
          onClose={() => setShowDespesa(false)}
          onSaved={() => {
            setShowDespesa(false);
            invalidateAll();
          }}
        />
      )}

      <div className="toolbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "primary" : "quiet"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "expenses" ? (
        <div className="card">
          {!despesas?.length ? (
            <p className="empty">Nenhuma despesa registrada.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Competência</th>
                  <th>Valor</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {despesas.map((d) => (
                  <tr key={d.id}>
                    <td>{d.descricao}</td>
                    <td>{d.categoria}</td>
                    <td>{formatDate(d.competencia)}</td>
                    <td>{formatMoney(d.valor)}</td>
                    <td>
                      <span className={`badge ${d.status.toLowerCase()}`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : tab === "departures" ? (
        <div className="card">
          {!saidas?.length ? (
            <p className="empty">Nenhum cliente inativo com saldo em aberto.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Saldo em aberto</th>
                </tr>
              </thead>
              <tbody>
                {saidas.map((s) => (
                  <tr key={s.empresaId}>
                    <td>{s.razaoSocial}</td>
                    <td className={s.saldoAberto > 0 ? "moneyneg" : ""}>{formatMoney(s.saldoAberto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card">
          {isLoading && <p>Carregando...</p>}
          {!isLoading && itemsFiltrados.length === 0 && <p className="empty">Nenhuma cobrança aqui.</p>}
          {itemsFiltrados.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Situação</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((c) => (
                  <tr key={c.id}>
                    <td>{c.descricao}</td>
                    <td>{empresaNome(c.empresaId)}</td>
                    <td>
                      <span className="badge">{TIPO_LABEL[c.tipo]}</span>
                    </td>
                    <td>{formatDate(c.vencimento)}</td>
                    <td>{formatMoney(c.valor)}</td>
                    <td>
                      <span className={`badge ${c.statusComputado.toLowerCase()}`}>
                        {STATUS_COMPUTADO_LABEL[c.statusComputado]}
                      </span>
                      {c.coraStatus && <div className="muted">{c.coraStatus}</div>}
                    </td>
                    <td>
                      {c.statusComputado === "PAGO" ? (
                        <button type="button" className="quiet" onClick={() => setAcao({ id: c.id, tipo: "estornar" })}>
                          Estornar
                        </button>
                      ) : (
                        <button type="button" className="quiet" onClick={() => setAcao({ id: c.id, tipo: "pagar" })}>
                          Registrar pagamento
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {acao && (
            <AcaoCobranca
              id={acao.id}
              tipo={acao.tipo}
              onClose={() => setAcao(null)}
              onDone={() => {
                setAcao(null);
                invalidateAll();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function AcaoCobranca({
  id,
  tipo,
  onClose,
  onDone,
}: {
  id: string;
  tipo: "pagar" | "estornar";
  onClose: () => void;
  onDone: () => void;
}) {
  const api = useApiClient();
  const [valor, setValor] = useState("");
  const [pagoEm, setPagoEm] = useState(new Date().toISOString().slice(0, 10));
  const [forma, setForma] = useState<FormaPagamento>("PIX");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (tipo === "pagar") {
        await api.post(`/api/v1/financeiro/cobrancas/${id}/pagamento`, {
          valor: Number(valor),
          pagoEm,
          formaPagamento: forma,
        });
      } else {
        await api.post(`/api/v1/financeiro/cobrancas/${id}/estorno`, { motivo });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao processar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="formgrid" style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 18 }} onSubmit={handleSubmit}>
      {tipo === "pagar" ? (
        <>
          <label>
            Valor recebido (R$)
            <input required type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
          </label>
          <label>
            Data do pagamento
            <input required type="date" value={pagoEm} onChange={(e) => setPagoEm(e.target.value)} />
          </label>
          <label>
            Forma de pagamento
            <select value={forma} onChange={(e) => setForma(e.target.value as FormaPagamento)}>
              <option value="PIX">Pix</option>
              <option value="BOLETO">Boleto</option>
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO">Cartão</option>
            </select>
          </label>
        </>
      ) : (
        <label className="wide">
          Motivo do estorno
          <textarea required value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </label>
      )}
      {error && <p className="form-error wide">{error}</p>}
      <div className="wide" style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="primary" disabled={isSubmitting}>
          {tipo === "pagar" ? "Confirmar recebimento" : "Confirmar estorno"}
        </button>
        <button type="button" className="quiet" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function NovoLancamentoForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const api = useApiClient();
  const { data: empresas } = useEmpresas();
  const [form, setForm] = useState({
    empresaId: "",
    descricao: "",
    valor: "",
    vencimento: "",
    tipo: "ESPORADICO" as "ESPORADICO" | "MENSAL" | "AJUSTE",
    competencia: new Date().toISOString().slice(0, 7),
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/financeiro/cobrancas", {
        empresaId: form.empresaId,
        descricao: form.descricao,
        valor: Number(form.valor),
        vencimento: form.vencimento,
        tipo: form.tipo,
        ...(form.tipo === "MENSAL" ? { competencia: form.competencia } : {}),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao lançar cobrança.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card formgrid" onSubmit={handleSubmit}>
      <h3 className="wide" style={{ margin: 0 }}>
        Novo lançamento a receber
      </h3>
      <label>
        Cliente
        <select required value={form.empresaId} onChange={(e) => setForm((p) => ({ ...p, empresaId: e.target.value }))}>
          <option value="">Selecione...</option>
          {empresas?.items.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.razaoSocial}
            </option>
          ))}
        </select>
      </label>
      <label>
        Descrição
        <input required value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
      </label>
      <label>
        Valor (R$)
        <input required type="number" min="0.01" step="0.01" value={form.valor} onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))} />
      </label>
      <label>
        Vencimento
        <input required type="date" value={form.vencimento} onChange={(e) => setForm((p) => ({ ...p, vencimento: e.target.value }))} />
      </label>
      <label>
        Tipo
        <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as typeof form.tipo }))}>
          <option value="ESPORADICO">Esporádico</option>
          <option value="MENSAL">Mensal</option>
          <option value="AJUSTE">Ajuste</option>
        </select>
      </label>
      {form.tipo === "MENSAL" && (
        <label>
          Competência
          <input type="month" value={form.competencia} onChange={(e) => setForm((p) => ({ ...p, competencia: e.target.value }))} />
        </label>
      )}
      {error && <p className="form-error wide">{error}</p>}
      <div className="wide" style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="primary" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Lançar"}
        </button>
        <button type="button" className="quiet" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function NovaDespesaForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const api = useApiClient();
  const [form, setForm] = useState({
    descricao: "",
    categoria: "Operacional",
    valor: "",
    competencia: new Date().toISOString().slice(0, 10),
    status: "PAGO" as "PAGO" | "PENDENTE",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/financeiro/despesas", {
        descricao: form.descricao,
        categoria: form.categoria,
        valor: Number(form.valor),
        competencia: form.competencia,
        status: form.status,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao registrar despesa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card formgrid" onSubmit={handleSubmit}>
      <h3 className="wide" style={{ margin: 0 }}>
        Registrar despesa
      </h3>
      <label>
        Descrição
        <input required value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
      </label>
      <label>
        Categoria
        <input value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))} />
      </label>
      <label>
        Valor (R$)
        <input required type="number" min="0.01" step="0.01" value={form.valor} onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))} />
      </label>
      <label>
        Data / competência
        <input required type="date" value={form.competencia} onChange={(e) => setForm((p) => ({ ...p, competencia: e.target.value }))} />
      </label>
      <label>
        Situação
        <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as typeof form.status }))}>
          <option value="PAGO">Pago</option>
          <option value="PENDENTE">Pendente</option>
        </select>
      </label>
      {error && <p className="form-error wide">{error}</p>}
      <div className="wide" style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="primary" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Registrar"}
        </button>
        <button type="button" className="quiet" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
