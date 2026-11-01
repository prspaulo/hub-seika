import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, useApiClient } from "../../lib/useApiClient";
import { useEmpresas, useAssignableUsers } from "../../lib/useReferenceData";
import { SETOR_LABEL, type DescontoTipo, type Setor } from "../../types/processo";

type FormState = {
  empresaId: string;
  owner: string;
  setor: Setor;
  nome: string;
  valorInicial: string;
  descontoTipo: DescontoTipo;
  desconto: string;
  prazo: string;
  vencimentoCobranca: string;
  descricao: string;
  coraSolicitado: boolean;
};

const EMPTY_FORM: FormState = {
  empresaId: "",
  owner: "",
  setor: "LEGALIZACAO",
  nome: "",
  valorInicial: "",
  descontoTipo: "REAIS",
  desconto: "0",
  prazo: "",
  vencimentoCobranca: "",
  descricao: "",
  coraSolicitado: false,
};

export function ProcessoForm() {
  const api = useApiClient();
  const navigate = useNavigate();
  const { data: empresas } = useEmpresas();
  const { data: users } = useAssignableUsers();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/processos", {
        empresaId: form.empresaId,
        owner: form.owner,
        setor: form.setor,
        nome: form.nome,
        valorInicial: Number(form.valorInicial),
        descontoTipo: form.descontoTipo,
        desconto: Number(form.desconto),
        prazo: form.prazo,
        vencimentoCobranca: form.vencimentoCobranca,
        ...(form.descricao ? { descricao: form.descricao } : {}),
        coraSolicitado: form.coraSolicitado,
      });
      navigate("/processos");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao cadastrar serviço.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <span className="eyebrow">JURÍDICO</span>
      <h1>Cadastrar serviço</h1>
      <form className="card formgrid" onSubmit={handleSubmit}>
        <label>
          Empresa / cliente
          <select required value={form.empresaId} onChange={(e) => update("empresaId", e.target.value)}>
            <option value="">Selecione...</option>
            {empresas?.items.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.razaoSocial}
              </option>
            ))}
          </select>
        </label>
        <label>
          Responsável
          <select required value={form.owner} onChange={(e) => update("owner", e.target.value)}>
            <option value="">Selecione...</option>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Setor
          <select value={form.setor} onChange={(e) => update("setor", e.target.value as Setor)}>
            {Object.entries(SETOR_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Serviço a realizar
          <input required value={form.nome} onChange={(e) => update("nome", e.target.value)} />
        </label>
        <label>
          Valor inicial (R$)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.valorInicial}
            onChange={(e) => update("valorInicial", e.target.value)}
          />
        </label>
        <label>
          Desconto em
          <select
            value={form.descontoTipo}
            onChange={(e) => update("descontoTipo", e.target.value as DescontoTipo)}
          >
            <option value="REAIS">R$</option>
            <option value="PERCENTUAL">%</option>
          </select>
        </label>
        <label>
          Desconto
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.desconto}
            onChange={(e) => update("desconto", e.target.value)}
          />
        </label>
        <label>
          Prazo do serviço
          <input
            required
            type="date"
            value={form.prazo}
            onChange={(e) => update("prazo", e.target.value)}
          />
        </label>
        <label>
          Vencimento da cobrança
          <input
            required
            type="date"
            value={form.vencimentoCobranca}
            onChange={(e) => update("vencimentoCobranca", e.target.value)}
          />
        </label>
        <label className="wide">
          Etapas / observações
          <textarea value={form.descricao} onChange={(e) => update("descricao", e.target.value)} />
        </label>
        <label className="wide" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            style={{ width: "auto", margin: 0 }}
            checked={form.coraSolicitado}
            onChange={(e) => update("coraSolicitado", e.target.checked)}
          />
          Solicitar emissão Cora após cadastrar
        </label>
        <div className="notice warn wide">
          A integração com a Cora ainda não está conectada — a cobrança fica registrada como pendente
          de emissão. Isso será ligado na Fase 4 (Financeiro).
        </div>
        {error && <p className="form-error wide">{error}</p>}
        <div className="wide">
          <button type="submit" className="primary" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Cadastrar serviço"}
          </button>
        </div>
      </form>
    </div>
  );
}
