import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../lib/useApiClient";
import {
  CARACTERISTICAS_FISCAIS,
  LUCRO_REAL_APURACAO_LABEL,
  NATUREZA_ATIVIDADE_LABEL,
  NATUREZA_JURIDICA_LABEL,
  ORGAO_REGISTRO_LABEL,
  PORTE_EMPRESA_LABEL,
  REGIME_TRIBUTARIO_LABEL,
  certificadoVencimentoStatus,
  formatCnpj,
  formatDate,
  type Empresa,
  type Filial,
  type Licenca,
  type LucroRealApuracao,
  type NaturezaAtividade,
  type NaturezaJuridica,
  type OrgaoRegistro,
  type PorteEmpresa,
  type RegimeTributario,
  type SocioAdministrador,
} from "../../types/empresa";
import {
  ATRASO_LABEL,
  SETOR_LABEL,
  STATUS_OBRIGACAO_LABEL,
  obrigacaoAtraso,
  type Obrigacao,
} from "../../types/processo";
import { useAssignableUsers } from "../../lib/useReferenceData";

type EmpresaDetailData = Empresa & {
  licencas: Licenca[];
  sociosAdministradores: SocioAdministrador[];
  filiais: Filial[];
};

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
const EMPTY_SOCIO_FORM = { nome: "", cpf: "" };
const EMPTY_FILIAL_FORM = { nome: "", cnpj: "", enderecoCidade: "", enderecoUf: "" };

export function EmpresaDetail() {
  const { id } = useParams<{ id: string }>();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [licencaForm, setLicencaForm] = useState(EMPTY_LICENCA_FORM);
  const [socioForm, setSocioForm] = useState(EMPTY_SOCIO_FORM);
  const [filialForm, setFilialForm] = useState(EMPTY_FILIAL_FORM);

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

  const addSocioMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/empresas/${id}/socios-administradores`, {
        nome: socioForm.nome,
        ...(socioForm.cpf ? { cpf: socioForm.cpf } : {}),
      }),
    onSuccess: () => {
      setSocioForm(EMPTY_SOCIO_FORM);
      invalidate();
    },
  });

  const deleteSocioMutation = useMutation({
    mutationFn: (socioId: string) => api.del(`/api/v1/empresas/${id}/socios-administradores/${socioId}`),
    onSuccess: invalidate,
  });

  const addFilialMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/empresas/${id}/filiais`, {
        nome: filialForm.nome,
        cnpj: filialForm.cnpj,
        ...(filialForm.enderecoCidade ? { enderecoCidade: filialForm.enderecoCidade } : {}),
        ...(filialForm.enderecoUf ? { enderecoUf: filialForm.enderecoUf } : {}),
      }),
    onSuccess: () => {
      setFilialForm(EMPTY_FILIAL_FORM);
      invalidate();
    },
  });

  const deleteFilialMutation = useMutation({
    mutationFn: (filialId: string) => api.del(`/api/v1/empresas/${id}/filiais/${filialId}`),
    onSuccess: invalidate,
  });

  const { data: mensalidade } = useQuery({
    queryKey: ["mensalidade", id],
    queryFn: () => api.get(`/api/v1/financeiro/mensalidades/${id}`) as Promise<Mensalidade | null>,
    enabled: !!id,
  });

  const { data: obrigacoesEmpresa } = useQuery({
    queryKey: ["obrigacoes-empresa", id],
    queryFn: () =>
      api.get(`/api/v1/obrigacoes?empresaId=${id}&pageSize=200`) as Promise<{ items: Obrigacao[]; total: number }>,
    enabled: !!id,
  });
  const { data: users } = useAssignableUsers();
  function ownerNome(ownerId: string) {
    return users?.find((u) => u.id === ownerId)?.name ?? "—";
  }

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
          <label>
            Cliente Seika desde
            <input
              key={`clienteDesde-${empresa.updatedAt}`}
              type="date"
              defaultValue={empresa.clienteDesde?.slice(0, 10) ?? ""}
              onBlur={(event) => updateMutation.mutate({ clienteDesde: event.target.value })}
            />
          </label>
          <label>
            Capital social (R$)
            <input
              key={`capitalSocial-${empresa.updatedAt}`}
              type="number"
              min="0"
              step="0.01"
              defaultValue={empresa.capitalSocial ?? ""}
              onBlur={(event) => updateMutation.mutate({ capitalSocial: Number(event.target.value) })}
            />
          </label>
          <label>
            Natureza jurídica
            <select
              key={`naturezaJuridica-${empresa.updatedAt}`}
              defaultValue={empresa.naturezaJuridica ?? ""}
              onChange={(event) =>
                updateMutation.mutate({ naturezaJuridica: event.target.value as NaturezaJuridica })
              }
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
            <select
              key={`porte-${empresa.updatedAt}`}
              defaultValue={empresa.porte ?? ""}
              onChange={(event) => updateMutation.mutate({ porte: event.target.value as PorteEmpresa })}
            >
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
              key={`orgaoRegistro-${empresa.updatedAt}`}
              defaultValue={empresa.orgaoRegistro ?? ""}
              onChange={(event) =>
                updateMutation.mutate({ orgaoRegistro: event.target.value as OrgaoRegistro })
              }
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
              key={`tipoAtividade-${empresa.updatedAt}`}
              defaultValue={empresa.tipoAtividade ?? ""}
              onBlur={(event) => updateMutation.mutate({ tipoAtividade: event.target.value })}
            />
          </label>
          <label>
            Regime tributário
            <select
              key={`regimeTributario-${empresa.updatedAt}`}
              defaultValue={empresa.regimeTributario ?? ""}
              onChange={(event) =>
                updateMutation.mutate({ regimeTributario: event.target.value as RegimeTributario })
              }
            >
              <option value="">Selecione...</option>
              {Object.entries(REGIME_TRIBUTARIO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {empresa.regimeTributario === "LUCRO_REAL" && (
            <label>
              Apuração do Lucro Real
              <select
                key={`lucroRealApuracao-${empresa.updatedAt}`}
                defaultValue={empresa.lucroRealApuracao ?? ""}
                onChange={(event) =>
                  updateMutation.mutate({ lucroRealApuracao: event.target.value as LucroRealApuracao })
                }
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
              key={`naturezaAtividade-${empresa.updatedAt}`}
              defaultValue={empresa.naturezaAtividade ?? ""}
              onChange={(event) =>
                updateMutation.mutate({ naturezaAtividade: event.target.value as NaturezaAtividade })
              }
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
            <input
              key={`inscricaoMunicipal-${empresa.updatedAt}`}
              defaultValue={empresa.inscricaoMunicipal ?? ""}
              onBlur={(event) => updateMutation.mutate({ inscricaoMunicipal: event.target.value })}
            />
          </label>
          <label>
            Inscrição estadual
            <input
              key={`inscricaoEstadual-${empresa.updatedAt}`}
              defaultValue={empresa.inscricaoEstadual ?? ""}
              onBlur={(event) => updateMutation.mutate({ inscricaoEstadual: event.target.value })}
            />
          </label>
          <label>
            NIRE
            <input
              key={`nire-${empresa.updatedAt}`}
              defaultValue={empresa.nire ?? ""}
              onBlur={(event) => updateMutation.mutate({ nire: event.target.value })}
            />
          </label>
        </div>

        <h3 style={{ marginTop: 20 }}>Endereço</h3>
        <div className="formgrid">
          <label>
            Logradouro
            <input
              key={`logradouro-${empresa.updatedAt}`}
              defaultValue={empresa.enderecoLogradouro ?? ""}
              onBlur={(event) => updateMutation.mutate({ enderecoLogradouro: event.target.value })}
            />
          </label>
          <label>
            Número
            <input
              key={`numero-${empresa.updatedAt}`}
              defaultValue={empresa.enderecoNumero ?? ""}
              onBlur={(event) => updateMutation.mutate({ enderecoNumero: event.target.value })}
            />
          </label>
          <label>
            Complemento
            <input
              key={`complemento-${empresa.updatedAt}`}
              defaultValue={empresa.enderecoComplemento ?? ""}
              onBlur={(event) => updateMutation.mutate({ enderecoComplemento: event.target.value })}
            />
          </label>
          <label>
            Bairro
            <input
              key={`bairro-${empresa.updatedAt}`}
              defaultValue={empresa.enderecoBairro ?? ""}
              onBlur={(event) => updateMutation.mutate({ enderecoBairro: event.target.value })}
            />
          </label>
          <label>
            Cidade
            <input
              key={`cidade-${empresa.updatedAt}`}
              defaultValue={empresa.enderecoCidade ?? ""}
              onBlur={(event) => updateMutation.mutate({ enderecoCidade: event.target.value })}
            />
          </label>
          <label>
            UF
            <input
              key={`uf-${empresa.updatedAt}`}
              maxLength={2}
              defaultValue={empresa.enderecoUf ?? ""}
              onBlur={(event) => updateMutation.mutate({ enderecoUf: event.target.value.toUpperCase() })}
            />
          </label>
          <label>
            CEP
            <input
              key={`cep-${empresa.updatedAt}`}
              defaultValue={empresa.enderecoCep ?? ""}
              onBlur={(event) => updateMutation.mutate({ enderecoCep: event.target.value })}
            />
          </label>
        </div>

        <h3 style={{ marginTop: 20 }}>Certificado digital</h3>
        <div className="formgrid">
          <label>
            Link do certificado
            <input
              key={`certUrl-${empresa.updatedAt}`}
              type="url"
              placeholder="https://drive.google.com/..."
              defaultValue={empresa.certificadoDigitalUrl ?? ""}
              onBlur={(event) => updateMutation.mutate({ certificadoDigitalUrl: event.target.value })}
            />
          </label>
          <label>
            Vencimento
            <input
              key={`certVenc-${empresa.updatedAt}`}
              type="date"
              defaultValue={empresa.certificadoDigitalVencimento?.slice(0, 10) ?? ""}
              onBlur={(event) => updateMutation.mutate({ certificadoDigitalVencimento: event.target.value })}
            />
          </label>
        </div>
        {empresa.certificadoDigitalVencimento &&
          (() => {
            const status = certificadoVencimentoStatus(empresa.certificadoDigitalVencimento);
            if (!status) return null;
            const label =
              status === "vencido"
                ? "Certificado vencido"
                : status === "vence_em_breve"
                  ? "Certificado vence em breve"
                  : "Certificado válido";
            const cls = status === "vencido" ? "inativa" : status === "vence_em_breve" ? "suspensa" : "ativa";
            return (
              <span className={`badge ${cls}`}>
                {label} ({formatDate(empresa.certificadoDigitalVencimento)})
              </span>
            );
          })()}

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
          <input
            type="checkbox"
            style={{ width: "auto", margin: 0 }}
            checked={empresa.temFilial}
            onChange={(event) => updateMutation.mutate({ temFilial: event.target.checked })}
          />
          Empresa possui filial
        </label>

        {updateMutation.isError && <p className="form-error">Não foi possível salvar a alteração.</p>}
        {empresa.status !== "INATIVA" && (
          <button type="button" className="danger" onClick={() => deleteMutation.mutate()}>
            Desativar empresa
          </button>
        )}
      </div>

      <div className="card">
        <h3>Características fiscais</h3>
        <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
          Alimenta o Motor de Obrigações — define quais obrigações fiscais/pessoais se aplicam a esta
          empresa.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px 16px" }}>
          {CARACTERISTICAS_FISCAIS.map((c) => (
            <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                style={{ width: "auto", margin: 0 }}
                checked={empresa[c.key]}
                onChange={(event) => updateMutation.mutate({ [c.key]: event.target.checked })}
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Obrigações desta empresa</h3>
        <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
          Geradas pelo Motor de Obrigações a partir do regime, atividade e características fiscais acima, mais
          obrigações manuais vinculadas a esta empresa.
        </p>
        {!obrigacoesEmpresa || obrigacoesEmpresa.items.length === 0 ? (
          <p className="empty">Nenhuma obrigação vinculada ainda. Use "Gerar obrigações do mês" na Central de Prazos.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Depto</th>
                <th>Competência</th>
                <th>Responsável</th>
                <th>Prazo interno</th>
                <th>Prazo legal</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {obrigacoesEmpresa.items.map((obrigacao) => {
                const atraso = obrigacaoAtraso(obrigacao);
                return (
                  <tr key={obrigacao.id}>
                    <td>
                      {obrigacao.titulo}
                      {obrigacao.templateId && <div className="muted">Gerada pelo motor</div>}
                    </td>
                    <td>{obrigacao.departamento ? SETOR_LABEL[obrigacao.departamento] : "—"}</td>
                    <td>{obrigacao.competencia ?? "—"}</td>
                    <td>{ownerNome(obrigacao.owner)}</td>
                    <td>{formatDate(obrigacao.prazo)}</td>
                    <td>{obrigacao.prazoLegal ? formatDate(obrigacao.prazoLegal) : "—"}</td>
                    <td>
                      {STATUS_OBRIGACAO_LABEL[obrigacao.status]}
                      {atraso && atraso !== "ok" && (
                        <div>
                          <span className={`badge ${atraso === "vencido_legal" ? "inativa" : "suspensa"}`}>
                            {ATRASO_LABEL[atraso]}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Link to="/obrigacoes" className="quiet-link" style={{ display: "inline-block", marginTop: 14 }}>
          Ver Central de Prazos →
        </Link>
      </div>

      <div className="card">
        <h3>Sócio(s) administrador(es) responsável(eis)</h3>
        {empresa.sociosAdministradores.length === 0 ? (
          <p className="empty">Nenhum sócio administrador cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {empresa.sociosAdministradores.map((socio) => (
                <tr key={socio.id}>
                  <td>{socio.nome}</td>
                  <td>{socio.cpf ?? "-"}</td>
                  <td>
                    <button type="button" className="quiet" onClick={() => deleteSocioMutation.mutate(socio.id)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form
          className="formgrid"
          style={{ marginTop: 16 }}
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            addSocioMutation.mutate();
          }}
        >
          <label>
            Nome
            <input
              required
              value={socioForm.nome}
              onChange={(event) => setSocioForm((prev) => ({ ...prev, nome: event.target.value }))}
            />
          </label>
          <label>
            CPF
            <input
              value={socioForm.cpf}
              onChange={(event) => setSocioForm((prev) => ({ ...prev, cpf: event.target.value }))}
            />
          </label>
          {addSocioMutation.isError && <p className="form-error wide">Não foi possível adicionar o sócio.</p>}
          <div className="wide">
            <button type="submit" className="primary">
              Adicionar sócio administrador
            </button>
          </div>
        </form>
      </div>

      {empresa.temFilial && (
        <div className="card">
          <h3>Filiais</h3>
          {empresa.filiais.length === 0 ? (
            <p className="empty">Nenhuma filial cadastrada.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CNPJ</th>
                  <th>Cidade/UF</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {empresa.filiais.map((filial) => (
                  <tr key={filial.id}>
                    <td>{filial.nome}</td>
                    <td>{formatCnpj(filial.cnpj)}</td>
                    <td>
                      {filial.enderecoCidade ?? "-"}
                      {filial.enderecoUf ? `/${filial.enderecoUf}` : ""}
                    </td>
                    <td>
                      <button type="button" className="quiet" onClick={() => deleteFilialMutation.mutate(filial.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form
            className="formgrid"
            style={{ marginTop: 16 }}
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              addFilialMutation.mutate();
            }}
          >
            <label>
              Nome
              <input
                required
                value={filialForm.nome}
                onChange={(event) => setFilialForm((prev) => ({ ...prev, nome: event.target.value }))}
              />
            </label>
            <label>
              CNPJ
              <input
                required
                placeholder="00.000.000/0000-00"
                value={filialForm.cnpj}
                onChange={(event) => setFilialForm((prev) => ({ ...prev, cnpj: event.target.value }))}
              />
            </label>
            <label>
              Cidade
              <input
                value={filialForm.enderecoCidade}
                onChange={(event) => setFilialForm((prev) => ({ ...prev, enderecoCidade: event.target.value }))}
              />
            </label>
            <label>
              UF
              <input
                maxLength={2}
                value={filialForm.enderecoUf}
                onChange={(event) =>
                  setFilialForm((prev) => ({ ...prev, enderecoUf: event.target.value.toUpperCase() }))
                }
              />
            </label>
            {addFilialMutation.isError && <p className="form-error wide">Não foi possível adicionar a filial.</p>}
            <div className="wide">
              <button type="submit" className="primary">
                Adicionar filial
              </button>
            </div>
          </form>
        </div>
      )}

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
