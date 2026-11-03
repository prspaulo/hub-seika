import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, useApiClient } from "../../lib/useApiClient";
import {
  CARACTERISTICAS_FISCAIS,
  LUCRO_REAL_APURACAO_LABEL,
  NATUREZA_ATIVIDADE_LABEL,
  NATUREZA_JURIDICA_LABEL,
  ORGAO_REGISTRO_LABEL,
  PORTE_EMPRESA_LABEL,
  REGIME_TRIBUTARIO_LABEL,
  type CaracteristicaFiscalKey,
  type Empresa,
  type LucroRealApuracao,
  type NaturezaAtividade,
  type NaturezaJuridica,
  type OrgaoRegistro,
  type PorteEmpresa,
  type RegimeTributario,
} from "../../types/empresa";

type FormState = {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  clienteDesde: string;
  capitalSocial: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  nire: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUf: string;
  enderecoCep: string;
  naturezaJuridica: NaturezaJuridica | "";
  porte: PorteEmpresa | "";
  orgaoRegistro: OrgaoRegistro | "";
  tipoAtividade: string;
  regimeTributario: RegimeTributario | "";
  lucroRealApuracao: LucroRealApuracao | "";
  naturezaAtividade: NaturezaAtividade | "";
  certificadoDigitalUrl: string;
  certificadoDigitalVencimento: string;
  temFilial: boolean;
};

type CaracteristicasFiscaisState = Record<CaracteristicaFiscalKey, boolean>;

const EMPTY_CARACTERISTICAS: CaracteristicasFiscaisState = Object.fromEntries(
  CARACTERISTICAS_FISCAIS.map((c) => [c.key, false]),
) as CaracteristicasFiscaisState;

const EMPTY_FORM: FormState = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  email: "",
  telefone: "",
  clienteDesde: "",
  capitalSocial: "",
  inscricaoMunicipal: "",
  inscricaoEstadual: "",
  nire: "",
  enderecoLogradouro: "",
  enderecoNumero: "",
  enderecoComplemento: "",
  enderecoBairro: "",
  enderecoCidade: "",
  enderecoUf: "",
  enderecoCep: "",
  naturezaJuridica: "",
  porte: "",
  orgaoRegistro: "",
  tipoAtividade: "",
  regimeTributario: "",
  lucroRealApuracao: "",
  naturezaAtividade: "",
  certificadoDigitalUrl: "",
  certificadoDigitalVencimento: "",
  temFilial: false,
};

type SocioRow = { nome: string; cpf: string };
type FilialRow = { nome: string; cnpj: string; enderecoCidade: string; enderecoUf: string };

const EMPTY_SOCIO: SocioRow = { nome: "", cpf: "" };
const EMPTY_FILIAL: FilialRow = { nome: "", cnpj: "", enderecoCidade: "", enderecoUf: "" };

export function EmpresaForm() {
  const api = useApiClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicasFiscaisState>(EMPTY_CARACTERISTICAS);
  const [socios, setSocios] = useState<SocioRow[]>([]);
  const [filiais, setFiliais] = useState<FilialRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateSocio(index: number, field: keyof SocioRow, value: string) {
    setSocios((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function updateFilial(index: number, field: keyof FilialRow, value: string) {
    setFiliais((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
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
        ...(form.clienteDesde ? { clienteDesde: form.clienteDesde } : {}),
        ...(form.capitalSocial ? { capitalSocial: Number(form.capitalSocial) } : {}),
        ...(form.inscricaoMunicipal ? { inscricaoMunicipal: form.inscricaoMunicipal } : {}),
        ...(form.inscricaoEstadual ? { inscricaoEstadual: form.inscricaoEstadual } : {}),
        ...(form.nire ? { nire: form.nire } : {}),
        ...(form.enderecoLogradouro ? { enderecoLogradouro: form.enderecoLogradouro } : {}),
        ...(form.enderecoNumero ? { enderecoNumero: form.enderecoNumero } : {}),
        ...(form.enderecoComplemento ? { enderecoComplemento: form.enderecoComplemento } : {}),
        ...(form.enderecoBairro ? { enderecoBairro: form.enderecoBairro } : {}),
        ...(form.enderecoCidade ? { enderecoCidade: form.enderecoCidade } : {}),
        ...(form.enderecoUf ? { enderecoUf: form.enderecoUf } : {}),
        ...(form.enderecoCep ? { enderecoCep: form.enderecoCep } : {}),
        ...(form.naturezaJuridica ? { naturezaJuridica: form.naturezaJuridica } : {}),
        ...(form.porte ? { porte: form.porte } : {}),
        ...(form.orgaoRegistro ? { orgaoRegistro: form.orgaoRegistro } : {}),
        ...(form.tipoAtividade ? { tipoAtividade: form.tipoAtividade } : {}),
        ...(form.regimeTributario ? { regimeTributario: form.regimeTributario } : {}),
        ...(form.regimeTributario === "LUCRO_REAL" && form.lucroRealApuracao
          ? { lucroRealApuracao: form.lucroRealApuracao }
          : {}),
        ...(form.naturezaAtividade ? { naturezaAtividade: form.naturezaAtividade } : {}),
        ...(form.certificadoDigitalUrl ? { certificadoDigitalUrl: form.certificadoDigitalUrl } : {}),
        ...(form.certificadoDigitalVencimento
          ? { certificadoDigitalVencimento: form.certificadoDigitalVencimento }
          : {}),
        temFilial: form.temFilial,
        ...caracteristicas,
      };
      const empresa = (await api.post("/api/v1/empresas", payload)) as Empresa;

      for (const socio of socios) {
        if (!socio.nome) continue;
        await api.post(`/api/v1/empresas/${empresa.id}/socios-administradores`, {
          nome: socio.nome,
          ...(socio.cpf ? { cpf: socio.cpf } : {}),
        });
      }

      if (form.temFilial) {
        for (const filial of filiais) {
          if (!filial.nome || !filial.cnpj) continue;
          await api.post(`/api/v1/empresas/${empresa.id}/filiais`, {
            nome: filial.nome,
            cnpj: filial.cnpj,
            ...(filial.enderecoCidade ? { enderecoCidade: filial.enderecoCidade } : {}),
            ...(filial.enderecoUf ? { enderecoUf: filial.enderecoUf } : {}),
          });
        }
      }

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
          <input required value={form.razaoSocial} onChange={(e) => update("razaoSocial", e.target.value)} />
        </label>
        <label>
          Nome fantasia
          <input value={form.nomeFantasia} onChange={(e) => update("nomeFantasia", e.target.value)} />
        </label>
        <label>
          CNPJ
          <input
            required
            placeholder="00.000.000/0000-00"
            value={form.cnpj}
            onChange={(e) => update("cnpj", e.target.value)}
          />
        </label>
        <label>
          Cliente Seika desde
          <input type="date" value={form.clienteDesde} onChange={(e) => update("clienteDesde", e.target.value)} />
        </label>
        <label>
          E-mail
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </label>
        <label>
          Telefone
          <input value={form.telefone} onChange={(e) => update("telefone", e.target.value)} />
        </label>
        <label>
          Capital social (R$)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.capitalSocial}
            onChange={(e) => update("capitalSocial", e.target.value)}
          />
        </label>
        <label>
          Natureza jurídica
          <select
            value={form.naturezaJuridica}
            onChange={(e) => update("naturezaJuridica", e.target.value as NaturezaJuridica)}
          >
            <option value="">Selecione...</option>
            {Object.entries(NATUREZA_JURIDICA_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Porte da empresa
          <select value={form.porte} onChange={(e) => update("porte", e.target.value as PorteEmpresa)}>
            <option value="">Selecione...</option>
            {Object.entries(PORTE_EMPRESA_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Órgão de registro
          <select
            value={form.orgaoRegistro}
            onChange={(e) => update("orgaoRegistro", e.target.value as OrgaoRegistro)}
          >
            <option value="">Selecione...</option>
            {Object.entries(ORGAO_REGISTRO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo de atividade
          <input
            placeholder="Ex: Comércio varejista de alimentos"
            value={form.tipoAtividade}
            onChange={(e) => update("tipoAtividade", e.target.value)}
          />
        </label>
        <label>
          Regime tributário
          <select
            value={form.regimeTributario}
            onChange={(e) => update("regimeTributario", e.target.value as RegimeTributario)}
          >
            <option value="">Selecione...</option>
            {Object.entries(REGIME_TRIBUTARIO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {form.regimeTributario === "LUCRO_REAL" && (
          <label>
            Apuração do Lucro Real
            <select
              value={form.lucroRealApuracao}
              onChange={(e) => update("lucroRealApuracao", e.target.value as LucroRealApuracao)}
            >
              <option value="">Selecione...</option>
              {Object.entries(LUCRO_REAL_APURACAO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Natureza da atividade
          <select
            value={form.naturezaAtividade}
            onChange={(e) => update("naturezaAtividade", e.target.value as NaturezaAtividade)}
          >
            <option value="">Selecione...</option>
            {Object.entries(NATUREZA_ATIVIDADE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Inscrição municipal
          <input value={form.inscricaoMunicipal} onChange={(e) => update("inscricaoMunicipal", e.target.value)} />
        </label>
        <label>
          Inscrição estadual
          <input value={form.inscricaoEstadual} onChange={(e) => update("inscricaoEstadual", e.target.value)} />
        </label>
        <label>
          NIRE
          <input value={form.nire} onChange={(e) => update("nire", e.target.value)} />
        </label>

        <div className="wide">
          <h3 style={{ margin: "8px 0" }}>Endereço</h3>
        </div>
        <label>
          Logradouro
          <input value={form.enderecoLogradouro} onChange={(e) => update("enderecoLogradouro", e.target.value)} />
        </label>
        <label>
          Número
          <input value={form.enderecoNumero} onChange={(e) => update("enderecoNumero", e.target.value)} />
        </label>
        <label>
          Complemento
          <input value={form.enderecoComplemento} onChange={(e) => update("enderecoComplemento", e.target.value)} />
        </label>
        <label>
          Bairro
          <input value={form.enderecoBairro} onChange={(e) => update("enderecoBairro", e.target.value)} />
        </label>
        <label>
          Cidade
          <input value={form.enderecoCidade} onChange={(e) => update("enderecoCidade", e.target.value)} />
        </label>
        <label>
          UF
          <input maxLength={2} value={form.enderecoUf} onChange={(e) => update("enderecoUf", e.target.value.toUpperCase())} />
        </label>
        <label>
          CEP
          <input value={form.enderecoCep} onChange={(e) => update("enderecoCep", e.target.value)} />
        </label>

        <div className="wide">
          <h3 style={{ margin: "8px 0" }}>Certificado digital</h3>
        </div>
        <label>
          Link do certificado (Drive/cofre externo)
          <input
            type="url"
            placeholder="https://drive.google.com/..."
            value={form.certificadoDigitalUrl}
            onChange={(e) => update("certificadoDigitalUrl", e.target.value)}
          />
        </label>
        <label>
          Vencimento do certificado
          <input
            type="date"
            value={form.certificadoDigitalVencimento}
            onChange={(e) => update("certificadoDigitalVencimento", e.target.value)}
          />
        </label>

        <div className="wide">
          <h3 style={{ margin: "8px 0" }}>Características fiscais</h3>
          <p className="muted" style={{ marginTop: -6, marginBottom: 10 }}>
            Alimenta o Motor de Obrigações — define quais obrigações fiscais/pessoais se aplicam a esta
            empresa.
          </p>
        </div>
        <div className="wide" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 16px" }}>
          {CARACTERISTICAS_FISCAIS.map((c) => (
            <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                style={{ width: "auto", margin: 0 }}
                checked={caracteristicas[c.key]}
                onChange={(e) => setCaracteristicas((prev) => ({ ...prev, [c.key]: e.target.checked }))}
              />
              {c.label}
            </label>
          ))}
        </div>

        <div className="wide">
          <h3 style={{ margin: "8px 0" }}>Sócio(s) administrador(es) responsável(eis)</h3>
        </div>
        {socios.map((socio, index) => (
          <div key={index} className="wide" style={{ display: "flex", gap: 10 }}>
            <input
              placeholder="Nome"
              style={{ flex: 2 }}
              value={socio.nome}
              onChange={(e) => updateSocio(index, "nome", e.target.value)}
            />
            <input
              placeholder="CPF (opcional)"
              style={{ flex: 1 }}
              value={socio.cpf}
              onChange={(e) => updateSocio(index, "cpf", e.target.value)}
            />
            <button type="button" className="quiet" onClick={() => setSocios((prev) => prev.filter((_, i) => i !== index))}>
              Remover
            </button>
          </div>
        ))}
        <div className="wide">
          <button type="button" className="quiet" onClick={() => setSocios((prev) => [...prev, { ...EMPTY_SOCIO }])}>
            + Adicionar sócio administrador
          </button>
        </div>

        <label className="wide" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            style={{ width: "auto", margin: 0 }}
            checked={form.temFilial}
            onChange={(e) => update("temFilial", e.target.checked)}
          />
          Empresa possui filial
        </label>

        {form.temFilial && (
          <>
            {filiais.map((filial, index) => (
              <div key={index} className="wide" style={{ display: "flex", gap: 10 }}>
                <input
                  placeholder="Nome da filial"
                  style={{ flex: 2 }}
                  value={filial.nome}
                  onChange={(e) => updateFilial(index, "nome", e.target.value)}
                />
                <input
                  required
                  placeholder="CNPJ da filial"
                  style={{ flex: 1 }}
                  value={filial.cnpj}
                  onChange={(e) => updateFilial(index, "cnpj", e.target.value)}
                />
                <input
                  placeholder="Cidade"
                  style={{ flex: 1 }}
                  value={filial.enderecoCidade}
                  onChange={(e) => updateFilial(index, "enderecoCidade", e.target.value)}
                />
                <input
                  placeholder="UF"
                  maxLength={2}
                  style={{ flex: "0 0 60px" }}
                  value={filial.enderecoUf}
                  onChange={(e) => updateFilial(index, "enderecoUf", e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  className="quiet"
                  onClick={() => setFiliais((prev) => prev.filter((_, i) => i !== index))}
                >
                  Remover
                </button>
              </div>
            ))}
            <div className="wide">
              <button type="button" className="quiet" onClick={() => setFiliais((prev) => [...prev, { ...EMPTY_FILIAL }])}>
                + Adicionar filial
              </button>
            </div>
          </>
        )}

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
