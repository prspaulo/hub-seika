import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useApiClient } from "../../lib/useApiClient";
import { useEmpresas, useAssignableUsers } from "../../lib/useReferenceData";
import {
  formatDate,
  formatMoney,
  STATUS_LABEL,
  STATUS_ORDER,
  type Processo,
  type StatusTarefa,
} from "../../types/processo";

type ListResponse = { items: Processo[]; total: number };

export function ProcessosBoard() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["processos"],
    queryFn: () => api.get("/api/v1/processos?pageSize=200") as Promise<ListResponse>,
  });
  const { data: empresas } = useEmpresas();
  const { data: users } = useAssignableUsers();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusTarefa }) =>
      api.patch(`/api/v1/processos/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["processos"] }),
  });

  const empresaNome = (id: string) => empresas?.items.find((e) => e.id === id)?.razaoSocial ?? "—";
  const ownerNome = (id: string) => users?.find((u) => u.id === id)?.name ?? "—";

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">JURÍDICO</span>
          <h1>Gestão de processos</h1>
          <p>Do cadastro à entrega, com responsável, prazo e cobrança vinculada.</p>
        </div>
        <Link to="/processos/novo" className="primary-link">
          + Cadastrar serviço
        </Link>
      </div>

      {isLoading && <p>Carregando...</p>}

      {data && (
        <div className="board">
          {STATUS_ORDER.map((status) => {
            const items = data.items.filter((p) => p.status === status);
            return (
              <div key={status} className="column">
                <h3>
                  {STATUS_LABEL[status]} <span>{items.length}</span>
                </h3>
                {items.map((processo) => (
                  <div key={processo.id} className="task">
                    <strong>{processo.nome}</strong>
                    <p>{empresaNome(processo.empresaId)}</p>
                    <p>
                      {ownerNome(processo.owner)} · {formatMoney(processo.valorFinal)}
                    </p>
                    <p>Prazo: {formatDate(processo.prazo)}</p>
                    <select
                      value={processo.status}
                      onChange={(event) =>
                        updateStatus.mutate({
                          id: processo.id,
                          status: event.target.value as StatusTarefa,
                        })
                      }
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {items.length === 0 && <p className="muted">Nenhum processo nesta etapa.</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
