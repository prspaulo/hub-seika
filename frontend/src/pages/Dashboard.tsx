import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../lib/useApiClient";
import { useEmpresas } from "../lib/useReferenceData";
import { formatMoney, STATUS_LABEL, type Processo } from "../types/processo";
import type { Obrigacao } from "../types/processo";
import type { Resumo, Cobranca, SaidaCliente } from "../types/financeiro";

const MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function last6Months(): { key: string; label: string }[] {
  const out = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTH_LABELS[d.getMonth()] });
  }
  return out;
}

export function Dashboard() {
  const api = useApiClient();
  const { data: empresas } = useEmpresas();

  const { data: processos } = useQuery({
    queryKey: ["dashboard-processos"],
    queryFn: () => api.get("/api/v1/processos?pageSize=200") as Promise<{ items: Processo[] }>,
  });
  const { data: obrigacoes } = useQuery({
    queryKey: ["dashboard-obrigacoes"],
    queryFn: () => api.get("/api/v1/obrigacoes?pageSize=200") as Promise<{ items: Obrigacao[] }>,
  });
  const { data: cobrancas } = useQuery({
    queryKey: ["dashboard-cobrancas"],
    queryFn: () => api.get("/api/v1/financeiro/cobrancas?pageSize=200") as Promise<{ items: Cobranca[] }>,
  });
  const { data: resumo } = useQuery({
    queryKey: ["dashboard-resumo"],
    queryFn: () => api.get("/api/v1/financeiro/resumo") as Promise<Resumo>,
  });
  const { data: saidas } = useQuery({
    queryKey: ["dashboard-saidas"],
    queryFn: () => api.get("/api/v1/financeiro/saidas-clientes") as Promise<SaidaCliente[]>,
  });

  const empresasAtivas = empresas?.items.filter((e) => e.status === "ATIVA").length ?? 0;
  const empresasSuspensas = empresas?.items.filter((e) => e.status === "SUSPENSA").length ?? 0;

  const items = processos?.items ?? [];
  const aFazer = items.filter((p) => p.status === "A_FAZER").length;
  const emAndamento = items.filter((p) => p.status === "EM_ANDAMENTO").length;
  const aguardandoCliente = items.filter((p) => p.status === "AGUARDANDO_CLIENTE").length;
  const concluidas = items.filter((p) => p.status === "CONCLUIDO").length;
  const emAberto = aFazer + emAndamento + aguardandoCliente;

  const hoje = new Date();
  const processosAtrasados = items.filter((p) => p.status !== "CONCLUIDO" && new Date(p.prazo) < hoje);
  const obrigacoesAtrasadas = (obrigacoes?.items ?? []).filter(
    (o) => o.status !== "CONCLUIDA" && new Date(o.prazo) < hoje,
  );

  const meses = last6Months();
  const entregasPorMes = meses.map(({ key, label }) => {
    const count = items.filter((p) => p.concluidoEm && p.concluidoEm.slice(0, 7) === key).length;
    return { label, count };
  });
  const maxEntregas = Math.max(1, ...entregasPorMes.map((m) => m.count));

  const empresasQuePagaram = new Set(
    (cobrancas?.items ?? []).filter((c) => c.statusComputado === "PAGO").map((c) => c.empresaId),
  ).size;
  const empresasComSaldoAberto = new Set(
    (cobrancas?.items ?? []).filter((c) => c.statusComputado !== "PAGO").map((c) => c.empresaId),
  ).size;

  const saldoCaixa = (resumo?.recebido ?? 0) - (resumo?.despesasPagas ?? 0);

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">VISÃO EXECUTIVA</span>
          <h1>Sua operação, em um só lugar.</h1>
          <p>Clientes, processos e resultados conectados à rotina da SEIKA.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/clientes/novo" className="quiet-link">
            + Empresa
          </Link>
          <Link to="/meu-espaco" className="primary-link">
            Meu dia →
          </Link>
        </div>
      </div>

      <div className="formgrid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 18 }}>
        <div className="card">
          <h3>Recebido acumulado</h3>
          <strong style={{ fontSize: 22 }}>{formatMoney(resumo?.recebido ?? 0)}</strong>
        </div>
        <div className="card">
          <h3>Saldo de caixa acumulado</h3>
          <strong style={{ fontSize: 22 }}>{formatMoney(saldoCaixa)}</strong>
        </div>
        <div className="card">
          <h3>A receber</h3>
          <strong style={{ fontSize: 22 }}>{formatMoney(resumo?.aReceber ?? 0)}</strong>
          {(resumo?.atrasado ?? 0) > 0 && (
            <p className="muted" style={{ color: "var(--red)" }}>
              {formatMoney(resumo!.atrasado)} em atraso
            </p>
          )}
        </div>
        <div className="card">
          <h3>Clientes ativos</h3>
          <strong style={{ fontSize: 22 }}>{empresasAtivas}</strong>
        </div>
      </div>

      <div className="formgrid" style={{ gridTemplateColumns: "1.6fr 1fr", marginBottom: 18, alignItems: "start" }}>
        <div className="card">
          <h3>Ritmo da operação ({emAberto} em aberto)</h3>
          <div className="formgrid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div>
              <p className="muted">A fazer</p>
              <strong>{aFazer}</strong>
            </div>
            <div>
              <p className="muted">Em andamento</p>
              <strong>{emAndamento}</strong>
            </div>
            <div>
              <p className="muted">Aguardando cliente</p>
              <strong>{aguardandoCliente}</strong>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 18, marginBottom: 6 }}>
            Entregas concluídas por mês
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 80 }}>
            {entregasPorMes.map((m) => (
              <div key={m.label} style={{ flex: 1, textAlign: "center" }}>
                <div
                  style={{
                    height: Math.max(4, (m.count / maxEntregas) * 60),
                    background: "var(--mint)",
                    borderRadius: 4,
                  }}
                />
                <span className="muted">
                  {m.label} · {m.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Precisa de atenção</h3>
          {processosAtrasados.length === 0 && obrigacoesAtrasadas.length === 0 ? (
            <>
              <p>
                <strong>Prazos sob controle</strong>
              </p>
              <p className="muted">Nenhum processo ou obrigação atrasado no momento.</p>
            </>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
              {processosAtrasados.map((p) => (
                <li key={p.id}>
                  {p.nome} — {STATUS_LABEL[p.status]}
                </li>
              ))}
              {obrigacoesAtrasadas.map((o) => (
                <li key={o.id}>{o.titulo} — obrigação</li>
              ))}
            </ul>
          )}
          <Link to="/obrigacoes/pendencias" className="quiet-link" style={{ display: "inline-block", marginTop: 14 }}>
            Ver pendências →
          </Link>
        </div>
      </div>

      <div className="formgrid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="card">
          <h3>Concluídas</h3>
          <strong style={{ fontSize: 22 }}>{concluidas}</strong>
        </div>
        <div className="card">
          <h3>Clientes que pagaram</h3>
          <strong style={{ fontSize: 22 }}>{empresasQuePagaram}</strong>
        </div>
        <div className="card">
          <h3>Clientes com saldo aberto</h3>
          <strong style={{ fontSize: 22 }}>{empresasComSaldoAberto}</strong>
        </div>
        <div className="card">
          <h3>Ex-clientes</h3>
          <strong style={{ fontSize: 22 }}>{saidas?.length ?? 0}</strong>
          <p className="muted">Paralisados: {empresasSuspensas}</p>
        </div>
      </div>
    </div>
  );
}
