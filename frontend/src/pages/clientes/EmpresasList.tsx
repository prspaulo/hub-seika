import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useApiClient } from "../../lib/useApiClient";
import { formatCnpj, type Empresa } from "../../types/empresa";

type ListResponse = { items: Empresa[]; total: number; page: number; pageSize: number };

export function EmpresasList() {
  const api = useApiClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["empresas", search],
    queryFn: () =>
      api.get(
        `/api/v1/empresas${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      ) as Promise<ListResponse>,
  });

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">CLIENTES</span>
          <h1>Empresas</h1>
        </div>
        <Link to="/clientes/novo" className="primary-link">
          + Nova empresa
        </Link>
      </div>

      <input
        className="search-input"
        placeholder="Buscar por razão social, nome fantasia ou CNPJ"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {isLoading && <p>Carregando...</p>}
      {isError && <p className="form-error">Erro ao carregar empresas.</p>}

      {data && data.items.length > 0 && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Razão social</th>
                <th>CNPJ</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((empresa) => (
                <tr key={empresa.id}>
                  <td>
                    {empresa.razaoSocial}
                    {empresa.nomeFantasia && <div className="muted">{empresa.nomeFantasia}</div>}
                  </td>
                  <td>{formatCnpj(empresa.cnpj)}</td>
                  <td>
                    <span className={`badge ${empresa.status.toLowerCase()}`}>{empresa.status}</span>
                  </td>
                  <td>
                    <Link to={`/clientes/${empresa.id}`}>Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.items.length === 0 && (
        <p className="empty">Nenhuma empresa encontrada.</p>
      )}
    </div>
  );
}
