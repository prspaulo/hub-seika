import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, useApiClient } from "../../lib/useApiClient";
import type { Empresa } from "../../types/empresa";

type FormState = {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
};

const EMPTY_FORM: FormState = { razaoSocial: "", nomeFantasia: "", cnpj: "", email: "", telefone: "" };

export function EmpresaForm() {
  const api = useApiClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof FormState>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        razaoSocial: form.razaoSocial,
        cnpj: form.cnpj,
        ...(form.nomeFantasia ? { nomeFantasia: form.nomeFantasia } : {}),
        ...(form.email ? { email: form.email } : {}),
        ...(form.telefone ? { telefone: form.telefone } : {}),
      };
      const empresa = (await api.post("/api/v1/empresas", payload)) as Empresa;
      navigate(`/clientes/${empresa.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar empresa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <span className="eyebrow">CLIENTES</span>
      <h1>Nova empresa</h1>
      <form className="card formgrid" onSubmit={handleSubmit}>
        <label>
          Razão social
          <input
            required
            value={form.razaoSocial}
            onChange={(event) => update("razaoSocial", event.target.value)}
          />
        </label>
        <label>
          Nome fantasia
          <input value={form.nomeFantasia} onChange={(event) => update("nomeFantasia", event.target.value)} />
        </label>
        <label>
          CNPJ
          <input
            required
            placeholder="00.000.000/0000-00"
            value={form.cnpj}
            onChange={(event) => update("cnpj", event.target.value)}
          />
        </label>
        <label>
          E-mail
          <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
        </label>
        <label>
          Telefone
          <input value={form.telefone} onChange={(event) => update("telefone", event.target.value)} />
        </label>
        {error && <p className="form-error wide">{error}</p>}
        <div className="wide">
          <button type="submit" className="primary" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
