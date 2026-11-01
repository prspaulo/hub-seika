import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../lib/useApiClient";
import { formatCnpj, type Empresa, type Licenca } from "../../types/empresa";

type EmpresaDetailData = Empresa & { licencas: Licenca[] };

type Mensalidade = {
  valor: number;
  diaVencimento: number;
  ativaDesde: string;
  ativo: boolean;
};

const EMPTY_LICENCA_FORM = { tipo: "", numero: "", validade: "" };
const EMPTY_MENSALIDADE_FORM = {
  valor: "",
  diaVencimento: "10",
  ativaDesde: new Date().toISOString().slice(0, 10),
  ativo: true,
};

export function EmpresaDetail() {
  const { id } = useParams<{ id: string }>();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [licencaForm, setLicencaForm] = useState(EMPTY_LICENCA_FORM);

  const { data: empresa, isLoading } = useQuery({
    queryKey: ["empresa", id],
    queryFn: () => api.get(`/api/v1/empresas/${id}`) as Promise<EmpresaDetailData>,
    enabled: !!id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["empresa", id] });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Empresa>) => api.patch(`/api/v1/empresas/${id}`, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/api/v1/empresas/${id}`),
    onSuccess: invalidate,
  });

  const addLicencaMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/empresas/${id}/licencas`, {
        tipo: licencaForm.tipo,
        ...(licencaForm.numero ? { numero: licencaForm.numero } : {}),
        ...(licencaForm.validade ? { validade: licencaForm.validade } : {}),
      }),
    onSuccess: () => {
      setLicencaForm(EMPTY_LICENCA_FORM);
      invalidate();
    },
  });

  const { data: mensalidade } = useQuery({
    queryKey: ["mensalidade", id],
    queryFn: () => api.get(`/api/v1/financeiro/mensalidades/${id}`) as Promise<Mensalidade | null>,
    enabled: !!id,
  });

  const [mensalidadeForm, setMensalidadeForm] = useState(EMPTY_MENSALIDADE_FORM);

  useEffect(() => {
    if (mensalidade) {
      setMensalidadeForm({
        valor: String(mensalidade.valor),
        diaVencimento: String(mensalidade.diaVencimento),
        ativaDesde: mensalidade.ativaDesde.slice(0, 10),
        ativo: mensalidade.ativo,
      });
    }
  }, [mensalidade]);

  const saveMensalidadeMutation = useMutation({
    mutationFn: () =>
      api.put(`/api/v1/financeiro/mensalidades/${id}`, {
        valor: Number(mensalidadeForm.valor),
        diaVencimento: Number(mensalidadeForm.diaVencimento),
        ativaDesde: mensalidadeForm.ativaDesde,
        ativo: mensalidadeForm.ativo,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mensalidade", id] }),
  });

  if (isLoading) return <p>Carregando...</p>;
  if (!empresa) return <p>Empresa não encontrada.</p>;

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">CLIENTES</span>
          <h1>{empresa.razaoSocial}</h1>
          <p>
            {empresa.nomeFantasia ? `${empresa.nomeFantasia} · ` : ""}
            {formatCnpj(empresa.cnpj)}
          </p>
        </div>
        <span className={`badge ${empresa.status.toLowerCase()}`}>{empresa.status}</span>
      </div>

      <div className="card">
        <h3>Dados cadastrais</h3>
        <div className="formgrid">
          <label>
            E-mail
            <input
              key={`email-${empresa.updatedAt}`}
              defaultValue={empresa.email ?? ""}
              onBlur={(event) => updateMutation.mutate({ email: event.target.value })}
            />
          </label>
          <label>
            Telefone
            <input
              key={`telefone-${empresa.updatedAt}`}
              defaultValue={empresa.telefone ?? ""}
              onBlur={(event) => updateMutation.mutate({ telefone: event.target.value })}
            />
          </label>
        </div>
        {updateMutation.isError && <p className="form-error">Não foi possível salvar a alteração.</p>}
        {empresa.status !== "INATIVA" && (
          <button type="button" className="danger" onClick={() => deleteMutation.mutate()}>
            Desativar empresa
          </button>
        )}
      </div>

      <div className="card">
        <h3>Licenças</h3>
        {empresa.licencas.length === 0 ? (
          <p className="empty">Nenhuma licença cadastrada.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Número</th>
                <th>Status</th>
                <th>Validade</th>
              </tr>
            </thead>
            <tbody>
              {empresa.licencas.map((licenca) => (
                <tr key={licenca.id}>
                  <td>{licenca.tipo}</td>
                  <td>{licenca.numero ?? "-"}</td>
                  <td>{licenca.status}</td>
                  <td>{licenca.validade ? new Date(licenca.validade).toLocaleDateString("pt-BR") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form
          className="formgrid"
          style={{ marginTop: 16 }}
          onSubmit={(event) => {
            event.preventDefault();
            addLicencaMutation.mutate();
          }}
        >
          <label>
            Tipo
            <input
              required
              value={licencaForm.tipo}
              onChange={(event) => setLicencaForm((prev) => ({ ...prev, tipo: event.target.value }))}
            />
          </label>
          <label>
            Número
            <input
              value={licencaForm.numero}
              onChange={(event) => setLicencaForm((prev) => ({ ...prev, numero: event.target.value }))}
            />
          </label>
          <label>
            Validade
            <input
              type="date"
              value={licencaForm.validade}
              onChange={(event) => setLicencaForm((prev) => ({ ...prev, validade: event.target.value }))}
            />
          </label>
          {addLicencaMutation.isError && <p className="form-error wide">Não foi possível adicionar a licença.</p>}
          <div className="wide">
            <button type="submit" className="primary">
              Adicionar licença
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Mensalidade (honorário recorrente)</h3>
        <form
          className="formgrid"
          onSubmit={(event) => {
            event.preventDefault();
            saveMensalidadeMutation.mutate();
          }}
        >
          <label>
            Valor mensal (R$)
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={mensalidadeForm.valor}
              onChange={(event) => setMensalidadeForm((prev) => ({ ...prev, valor: event.target.value }))}
            />
          </label>
          <label>
            Dia de vencimento
            <input
              required
              type="number"
              min="1"
              max="28"
              value={mensalidadeForm.diaVencimento}
              onChange={(event) =>
                setMensalidadeForm((prev) => ({ ...prev, diaVencimento: event.target.value }))
              }
            />
          </label>
          <label>
            Ativa desde
            <input
              required
              type="date"
              value={mensalidadeForm.ativaDesde}
              onChange={(event) =>
                setMensalidadeForm((prev) => ({ ...prev, ativaDesde: event.target.value }))
              }
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
            <input
              type="checkbox"
              style={{ width: "auto", margin: 0 }}
              checked={mensalidadeForm.ativo}
              onChange={(event) =>
                setMensalidadeForm((prev) => ({ ...prev, ativo: event.target.checked }))
              }
            />
            Ativa (gera cobrança mensal automaticamente)
          </label>
          {saveMensalidadeMutation.isError && (
            <p className="form-error wide">Não foi possível salvar a mensalidade.</p>
          )}
          <div className="wide">
            <button type="submit" className="primary">
              {mensalidade ? "Atualizar mensalidade" : "Ativar mensalidade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
