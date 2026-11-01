import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { useApiClient } from "../../lib/useApiClient";
import { useEmpresas } from "../../lib/useReferenceData";
import { formatDate, formatMoney, STATUS_LABEL, type Obrigacao, type Processo } from "../../types/processo";

type ProcessosResponse = { items: Processo[] };
type ObrigacoesResponse = { items: Obrigacao[] };

export function MeuEspaco() {
  const { user } = useAuth();
  const api = useApiClient();
  const { data: empresas } = useEmpresas();

  const { data: processos, isLoading: loadingProcessos } = useQuery({
    queryKey: ["meu-espaco-processos", user?.id],
    queryFn: () =>
      api.get(`/api/v1/processos?owner=${user!.id}&pageSize=200`) as Promise<ProcessosResponse>,
    enabled: !!user,
  });

  const { data: obrigacoes, isLoading: loadingObrigacoes } = useQuery({
    queryKey: ["meu-espaco-obrigacoes", user?.id],
    queryFn: () =>
      api.get(`/api/v1/obrigacoes?owner=${user!.id}&pageSize=200`) as Promise<ObrigacoesResponse>,
    enabled: !!user,
  });

  const empresaNome = (id: string | null) =>
    id ? (empresas?.items.find((e) => e.id === id)?.razaoSocial ?? "—") : "Interna";

  const processosAbertos = (processos?.items ?? [])
    .filter((p) => p.status !== "CONCLUIDO")
    .sort((a, b) => a.prazo.localeCompare(b.prazo));
  const obrigacoesAbertas = (obrigacoes?.items ?? [])
    .filter((o) => o.status !== "CONCLUIDO")
    .sort((a, b) => a.prazo.localeCompare(b.prazo));

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">SEU FOCO HOJE</span>
          <h1>Olá, {user?.name.split(" ")[0]}.</h1>
          <p>Processos e obrigações sob sua responsabilidade, ordenados por prazo.</p>
        </div>
      </div>

      <div className="card">
        <h3>Seus processos em aberto</h3>
        {loadingProcessos && <p>Carregando...</p>}
        {processosAbertos.length === 0 && !loadingProcessos && (
          <p className="empty">Nenhum processo em aberto sob sua responsabilidade.</p>
        )}
        {processosAbertos.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Cliente</th>
                <th>Etapa</th>
                <th>Prazo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {processosAbertos.map((processo) => (
                <tr key={processo.id}>
                  <td>{processo.nome}</td>
                  <td>{empresaNome(processo.empresaId)}</td>
                  <td>
                    <span className={`badge ${processo.status.toLowerCase()}`}>
                      {STATUS_LABEL[processo.status]}
                    </span>
                  </td>
                  <td>{formatDate(processo.prazo)}</td>
                  <td>{formatMoney(processo.valorFinal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Suas obrigações em aberto</h3>
        {loadingObrigacoes && <p>Carregando...</p>}
        {obrigacoesAbertas.length === 0 && !loadingObrigacoes && (
          <p className="empty">Nenhuma obrigação em aberto sob sua responsabilidade.</p>
        )}
        {obrigacoesAbertas.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Cliente</th>
                <th>Etapa</th>
                <th>Prazo</th>
              </tr>
            </thead>
            <tbody>
              {obrigacoesAbertas.map((obrigacao) => (
                <tr key={obrigacao.id}>
                  <td>{obrigacao.titulo}</td>
                  <td>{empresaNome(obrigacao.empresaId)}</td>
                  <td>
                    <span className={`badge ${obrigacao.status.toLowerCase()}`}>
                      {STATUS_LABEL[obrigacao.status]}
                    </span>
                  </td>
                  <td>{formatDate(obrigacao.prazo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
