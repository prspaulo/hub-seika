import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../lib/useApiClient";
import { useAssignableUsers, useEmpresas } from "../../lib/useReferenceData";
import { formatDate, STATUS_LABEL, type Processo } from "../../types/processo";

type ProcessosResponse = { items: Processo[] };

export function Operacional() {
  const api = useApiClient();
  const { data: users } = useAssignableUsers();
  const { data: empresas } = useEmpresas();

  const { data, isLoading } = useQuery({
    queryKey: ["operacional-processos"],
    queryFn: () => api.get("/api/v1/processos?pageSize=200") as Promise<ProcessosResponse>,
  });

  const empresaNome = (id: string) => empresas?.items.find((e) => e.id === id)?.razaoSocial ?? "—";

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
    </div>
  );
}
