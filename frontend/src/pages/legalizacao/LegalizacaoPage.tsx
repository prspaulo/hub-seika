import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../lib/useApiClient";
import { useEmpresas } from "../../lib/useReferenceData";
import { formatDate } from "../../types/processo";
import { buildMinuta, type Ato, type MinutaInput } from "./minutaTemplate";

type LicencaComEmpresa = {
  id: string;
  tipo: string;
  status: "VALIDA" | "VENCIDA" | "EM_RENOVACAO";
  validade: string | null;
  empresa: { id: string; razaoSocial: string; status: string };
};

const EMPTY_MINUTA: MinutaInput = {
  act: "Constituição",
  ordinal: 1,
  name: "",
  cnpj: "",
  nire: "",
  address: "",
  size: "Sem enquadramento",
  city: "Belo Horizonte / MG",
  partners: "",
  object: "",
  capital: 10000,
  quotaValue: 1,
  distribution: "",
  admins: "",
  start: new Date().toISOString().slice(0, 10),
  signatureDate: new Date().toISOString().slice(0, 10),
  changes: "",
  consolidation: "",
  extra: "",
};

function isVencida(licenca: LicencaComEmpresa) {
  if (licenca.status === "VENCIDA") return true;
  if (!licenca.validade) return false;
  return new Date(licenca.validade) < new Date();
}

export function LegalizacaoPage() {
  const api = useApiClient();
  const { data: empresas } = useEmpresas();
  const { data: licencas, isLoading } = useQuery({
    queryKey: ["licencas-todas"],
    queryFn: () => api.get("/api/v1/empresas/licencas") as Promise<LicencaComEmpresa[]>,
  });

  const [showMinuta, setShowMinuta] = useState(false);
  const [form, setForm] = useState<MinutaInput>(EMPTY_MINUTA);
  const [draft, setDraft] = useState<{ title: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vencidas = useMemo(() => (licencas ?? []).filter(isVencida).length, [licencas]);

  function update<K extends keyof MinutaInput>(field: K, value: MinutaInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function fillFromEmpresa(empresaId: string) {
    const empresa = empresas?.items.find((e) => e.id === empresaId);
    if (!empresa) return;
    update("name", empresa.razaoSocial);
    update("cnpj", empresa.cnpj);
  }

  function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      setDraft(buildMinuta(form));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar minuta.");
    }
  }

  if (draft) {
    return (
      <div>
        <span className="eyebrow">LEGALIZAÇÃO</span>
        <h1>{draft.title}</h1>
        <div className="notice warn">
          Rascunho gerado automaticamente — exige revisão técnica antes de qualquer protocolo ou uso.
        </div>
        <div className="report">{draft.text}</div>
        <div className="wide" style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button type="button" className="primary" onClick={() => navigator.clipboard.writeText(draft.text)}>
            Copiar texto
          </button>
          <button
            type="button"
            className="quiet"
            onClick={() => {
              setDraft(null);
              setShowMinuta(false);
            }}
          >
            Nova minuta
          </button>
        </div>
      </div>
    );
  }

  if (showMinuta) {
    return (
      <div>
        <span className="eyebrow">LEGALIZAÇÃO</span>
        <h1>Preparação de minuta societária</h1>
        <div className="notice">
          Modelo-base editável para sociedade limitada. Outros tipos jurídicos ficam fora da geração
          automática. O instrumento só deve ser protocolado após revisão técnica.
        </div>
        <form className="card formgrid" onSubmit={handleGenerate}>
          <label>
            Preencher a partir do cliente
            <select onChange={(e) => fillFromEmpresa(e.target.value)} defaultValue="">
              <option value="">Novo cadastro / preencher</option>
              {empresas?.items.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razaoSocial}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ato
            <select value={form.act} onChange={(e) => update("act", e.target.value as Ato)}>
              <option value="Constituição">Constituição</option>
              <option value="Alteração">Alteração</option>
              <option value="Distrato">Distrato</option>
            </select>
          </label>
          {form.act !== "Constituição" && (
            <label>
              Número da alteração
              <input
                type="number"
                min={1}
                value={form.ordinal}
                onChange={(e) => update("ordinal", Number(e.target.value))}
              />
            </label>
          )}
          <label>
            Nome empresarial
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label>
            CNPJ {form.act !== "Constituição" ? "(obrigatório)" : "(para alteração/distrato)"}
            <input value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} />
          </label>
          <label>
            NIRE {form.act !== "Constituição" ? "(obrigatório)" : "(para alteração/distrato)"}
            <input value={form.nire} onChange={(e) => update("nire", e.target.value)} />
          </label>
          <label>
            Sede completa com CEP
            <input required value={form.address} onChange={(e) => update("address", e.target.value)} />
          </label>
          <label>
            Porte
            <select value={form.size} onChange={(e) => update("size", e.target.value as MinutaInput["size"])}>
              <option value="Sem enquadramento">Sem enquadramento</option>
              <option value="ME">ME</option>
              <option value="EPP">EPP</option>
            </select>
          </label>
          <label>
            Cidade / UF
            <input required value={form.city} onChange={(e) => update("city", e.target.value)} />
          </label>
          <label className="wide">
            Qualificação completa dos sócios (um por parágrafo)
            <textarea
              required
              value={form.partners}
              onChange={(e) => update("partners", e.target.value)}
              placeholder="Nome, nacionalidade, estado civil e regime de bens, profissão, CPF, documento, endereço completo."
            />
          </label>
          <label className="wide">
            Objeto social e atividades por extenso (com CNAEs)
            <textarea required value={form.object} onChange={(e) => update("object", e.target.value)} />
          </label>
          <label>
            Capital social (R$)
            <input
              required
              type="number"
              min={1}
              step="0.01"
              value={form.capital}
              onChange={(e) => update("capital", Number(e.target.value))}
            />
          </label>
          <label>
            Valor de cada quota (R$)
            <input
              required
              type="number"
              min={0.01}
              step="0.01"
              value={form.quotaValue}
              onChange={(e) => update("quotaValue", Number(e.target.value))}
            />
          </label>
          <label className="wide">
            Distribuição de quotas e forma/prazo de integralização
            <textarea
              required
              value={form.distribution}
              onChange={(e) => update("distribution", e.target.value)}
            />
          </label>
          <label className="wide">
            Administrador(es), qualificação e poderes
            <textarea required value={form.admins} onChange={(e) => update("admins", e.target.value)} />
          </label>
          <label>
            Início das atividades
            <input required type="date" value={form.start} onChange={(e) => update("start", e.target.value)} />
          </label>
          <label>
            Data do instrumento
            <input
              required
              type="date"
              value={form.signatureDate}
              onChange={(e) => update("signatureDate", e.target.value)}
            />
          </label>
          {form.act !== "Constituição" && (
            <label className="wide">
              Cláusulas alteradas OU termos do distrato
              <textarea required value={form.changes} onChange={(e) => update("changes", e.target.value)} />
            </label>
          )}
          <label className="wide">
            Consolidação integral revisada (quando necessária)
            <textarea value={form.consolidation} onChange={(e) => update("consolidation", e.target.value)} />
          </label>
          <label className="wide">
            Cláusulas específicas revisadas / foro / regras de sucessão
            <textarea value={form.extra} onChange={(e) => update("extra", e.target.value)} />
          </label>
          {error && <p className="form-error wide">{error}</p>}
          <div className="wide" style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="primary">
              Preparar minuta editável
            </button>
            <button type="button" className="quiet" onClick={() => setShowMinuta(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">REGULARIDADE E REGISTROS</span>
          <h1>Legalização</h1>
          <p>Licenças centralizadas e preparação assistida de minutas societárias.</p>
        </div>
        <button type="button" className="primary-link" onClick={() => setShowMinuta(true)}>
          + Preparar minuta
        </button>
      </div>

      {isLoading && <p>Carregando...</p>}

      {licencas && (
        <>
          <div className="formgrid" style={{ marginBottom: 18 }}>
            <div className="card">
              <h3>Vencidas</h3>
              <strong style={{ fontSize: 26 }}>{vencidas}</strong>
            </div>
            <div className="card">
              <h3>Total de licenças</h3>
              <strong style={{ fontSize: 26 }}>{licencas.length}</strong>
            </div>
          </div>

          {licencas.length === 0 ? (
            <p className="empty">Nenhuma licença cadastrada ainda (cadastre pela ficha da empresa).</p>
          ) : (
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Tipo</th>
                    <th>Situação</th>
                    <th>Validade</th>
                  </tr>
                </thead>
                <tbody>
                  {licencas.map((licenca) => (
                    <tr key={licenca.id}>
                      <td>{licenca.empresa.razaoSocial}</td>
                      <td>{licenca.tipo}</td>
                      <td>
                        <span className={`badge ${isVencida(licenca) ? "inativa" : "ativa"}`}>
                          {isVencida(licenca) ? "Vencida" : licenca.status}
                        </span>
                      </td>
                      <td>{licenca.validade ? formatDate(licenca.validade) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
