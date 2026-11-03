import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../lib/useApiClient";
import { useAssignableUsers, useEmpresas } from "../../lib/useReferenceData";
import {
  formatDate,
  obrigacaoAtraso,
  STATUS_LABEL,
  STATUS_OBRIGACAO_LABEL,
  type Obrigacao,
  type Processo,
} from "../../types/processo";

type ProcessosResponse = { items: Processo[] };
type ObrigacoesResponse = { items: Obrigacao[] };

export function Operacional() {
  const api = useApiClient();
  const { data: users } = useAssignableUsers();
  const { data: empresas } = useEmpresas();

  const { data, isLoading } = useQuery({
    queryKey: ["operacional-processos"],
    queryFn: () => api.get("/api/v1/processos?pageSize=200") as Promise<ProcessosResponse>,
  });

  const { data: obrigacoesData, isLoading: isLoadingObrigacoes } = useQuery({
    queryKey: ["operacional-obrigacoes"],
    queryFn: () => api.get("/api/v1/obrigacoes?pageSize=200") as Promise<ObrigacoesResponse>,
  });

  const empresaNome = (id: string | null) =>
    id ? (empresas?.items.find((e) => e.id === id)?.razaoSocial ?? "—") : "Interna";

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">TRANSPARÊNCIA NA EQUIPE</span>
          <h1>Operacional dos sócios</h1>
          <p>Uma coluna por responsável, com todos os processos em aberto.</p>
        </div>
      </div>

      {isLoading && <p>Carregando...</p>}

      {data && users && (
        <div className="board">
          {users.map((user) => {
            const items = data.items.filter((p) => p.owner === user.id && p.status !== "CONCLUIDO");
            return (
              <div key={user.id} className="column">
                <h3>
                  @{user.name} <span>{items.length}</span>
                </h3>
                {items.map((processo) => (
                  <div key={processo.id} className="task">
                    <strong>{processo.nome}</strong>
                    <p>{empresaNome(processo.empresaId)}</p>
                    <p>
                      {STATUS_LABEL[processo.status]} · {formatDate(processo.prazo)}
                    </p>
                  </div>
                ))}
                {items.length === 0 && <p className="muted">Nenhum processo em aberto.</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="hero" style={{ marginTop: 32 }}>
        <div>
          <span className="eyebrow">MOTOR DE OBRIGAÇÕES</span>
          <h1>Obrigações por responsável</h1>
          <p>Manuais e geradas pelo motor, por sócio — vencidas aparecem marcadas.</p>
        </div>
      </div>

      {isLoadingObrigacoes && <p>Carregando...</p>}

      {obrigacoesData && users && (
        <div className="board">
          {users.map((user) => {
            const items = obrigacoesData.items.filter(
              (o) => o.owner === user.id && o.status !== "CONCLUIDA" && o.status !== "NAO_APLICAVEL",
            );
            return (
              <div key={user.id} className="column">
                <h3>
                  @{user.name} <span>{items.length}</span>
                </h3>
                {items.map((obrigacao) => {
                  const atraso = obrigacaoAtraso(obrigacao);
                  return (
                    <div key={obrigacao.id} className="task">
                      <strong>{obrigacao.titulo}</strong>
                      <p>{empresaNome(obrigacao.empresaId)}</p>
                      <p>
                        {STATUS_OBRIGACAO_LABEL[obrigacao.status]} · {formatDate(obrigacao.prazo)}
                      </p>
                      {atraso && atraso !== "ok" && (
                        <span className={`badge ${atraso === "vencido_legal" ? "inativa" : "suspensa"}`}>
                          {atraso === "vencido_legal" ? "Prazo legal vencido" : "Prazo interno vencido"}
                        </span>
                      )}
                    </div>
                  );
                })}
                {items.length === 0 && <p className="muted">Nenhuma obrigação em aberto.</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
