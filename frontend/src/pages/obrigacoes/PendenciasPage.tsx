import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useApiClient } from "../../lib/useApiClient";
import { useEmpresas, useAssignableUsers } from "../../lib/useReferenceData";
import {
  formatDate,
  obrigacaoAtraso,
  SETOR_LABEL,
  STATUS_OBRIGACAO_LABEL,
  type AtrasoObrigacao,
  type Obrigacao,
} from "../../types/processo";

type ListResponse = { items: Obrigacao[]; total: number };

const BUCKETS: { key: AtrasoObrigacao; titulo: string; className: string }[] = [
  { key: "vencido_legal", titulo: "Prazo legal vencido — crítico", className: "inativa" },
  { key: "vencido_interno", titulo: "Prazo interno vencido — fora da meta Seika", className: "suspensa" },
  { key: "ok", titulo: "Em dia", className: "ativa" },
];

export function PendenciasPage() {
  const api = useApiClient();
  const { data: empresas } = useEmpresas();
  const { data: users } = useAssignableUsers();

  const { data, isLoading } = useQuery({
    queryKey: ["obrigacoes-pendencias"],
    queryFn: () => api.get("/api/v1/obrigacoes?pageSize=200") as Promise<ListResponse>,
  });

  function empresaNome(id: string | null) {
    if (!id) return "Interna / sem cliente";
    return empresas?.items.find((e) => e.id === id)?.razaoSocial ?? "—";
  }
  function ownerNome(id: string) {
    return users?.find((u) => u.id === id)?.name ?? "—";
  }

  const pendentes = (data?.items ?? []).filter((o) => o.status !== "CONCLUIDA" && o.status !== "NAO_APLICAVEL");

  const porBucket = BUCKETS.map((bucket) => ({
    ...bucket,
    itens: pendentes
      .filter((o) => obrigacaoAtraso(o) === bucket.key)
      .sort((a, b) => a.prazo.localeCompare(b.prazo)),
  }));

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">CENTRAL DE PENDÊNCIAS</span>
          <h1>Pendências</h1>
          <p>Todas as obrigações em aberto, ordenadas por urgência — vencidas primeiro.</p>
        </div>
        <Link to="/obrigacoes" className="primary-link">
          Ver Central de Prazos
        </Link>
      </div>

      {isLoading && <p>Carregando...</p>}

      {!isLoading && pendentes.length === 0 && (
        <p className="empty">Nenhuma pendência em aberto no momento.</p>
      )}

      {porBucket.map((bucket) => (
        <div key={bucket.key} className="card" style={{ marginBottom: 18 }}>
          <h3>
            {bucket.titulo} <span className={`badge ${bucket.className}`}>{bucket.itens.length}</span>
          </h3>
          {bucket.itens.length === 0 ? (
            <p className="muted">Nada aqui.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Cliente</th>
                  <th>Depto</th>
                  <th>Responsável</th>
                  <th>Prazo interno</th>
                  <th>Prazo legal</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {bucket.itens.map((obrigacao) => (
                  <tr key={obrigacao.id}>
                    <td>{obrigacao.titulo}</td>
                    <td>{empresaNome(obrigacao.empresaId)}</td>
                    <td>{obrigacao.departamento ? SETOR_LABEL[obrigacao.departamento] : "—"}</td>
                    <td>{ownerNome(obrigacao.owner)}</td>
                    <td>{formatDate(obrigacao.prazo)}</td>
                    <td>{obrigacao.prazoLegal ? formatDate(obrigacao.prazoLegal) : "—"}</td>
                    <td>{STATUS_OBRIGACAO_LABEL[obrigacao.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
