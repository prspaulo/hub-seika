# Fluxos e diagramas de sequência

> Diagramas em [Mermaid](https://mermaid.js.org) — renderizam direto no GitHub e em extensões de preview
> de Markdown do VSCode. Complementa [`arquitetura.md`](./arquitetura.md), que explica os módulos e
> padrões; aqui o foco é "o que acontece, passo a passo" nos fluxos mais importantes do sistema.

## 1. Login e renovação automática de sessão

O frontend nunca deixa o usuário "cair" por o token de acesso ter expirado — a renovação acontece sozinha,
no meio de qualquer requisição que tome um 401.

```mermaid
sequenceDiagram
    actor U as Sócio/Funcionário
    participant F as Frontend (AuthContext)
    participant A as Backend — /api/v1/auth
    participant DB as Postgres (schema auth)

    U->>F: e-mail + senha
    F->>A: POST /auth/login
    A->>DB: SELECT User WHERE email
    DB-->>A: passwordHash
    A->>A: bcrypt.compare(senha, hash)
    A->>DB: INSERT RefreshToken (hash SHA-256, expira em 30 dias)
    A-->>F: 200 { accessToken (JWT, 15 min), user }<br/>+ Set-Cookie refresh (httpOnly)
    F->>F: guarda accessToken em memória (não em localStorage)
    F-->>U: entra no sistema

    Note over F,A: ... 15 minutos depois, token de acesso expirou ...

    U->>F: navega pra qualquer tela
    F->>A: GET /api/v1/empresas (Authorization: Bearer <expirado>)
    A-->>F: 401 Unauthorized
    F->>A: POST /auth/refresh (cookie httpOnly automático)
    A->>DB: busca RefreshToken pelo hash do cookie
    A->>A: valida: não revogado, não expirado
    A->>DB: UPDATE RefreshToken SET revokedAt (o antigo morre)
    A->>DB: INSERT RefreshToken (novo, rotacionado)
    A-->>F: 200 { accessToken novo } + Set-Cookie novo refresh
    F->>A: repete GET /api/v1/empresas (token novo)
    A-->>F: 200 OK
    F-->>U: tela carrega normalmente, sem perceber a renovação
```

Se o refresh token também estiver inválido/expirado (ex: `logout` em outro dispositivo, ou 30 dias sem
uso), o segundo passo falha e o frontend redireciona pro login.

## 2. Criar um serviço (Processo) com cobrança vinculada

A garantia importante aqui é **atomicidade**: ou o Processo e a Cobrança são gravados juntos, ou nenhum dos
dois é gravado.

```mermaid
sequenceDiagram
    actor U as Sócio/Funcionário
    participant F as Frontend (ProcessoForm)
    participant PS as processosService
    participant ES as empresasService
    participant AS as authService
    participant CS as cobrancasService
    participant DB as Postgres

    U->>F: preenche empresa, serviço, valor, desconto, prazo
    F->>PS: POST /api/v1/processos
    PS->>ES: getById(empresaId)
    ES->>DB: SELECT Empresa
    alt empresa não existe
        ES-->>PS: 404 NotFoundError
        PS-->>F: 404
    end
    PS->>AS: ensureUserExists(owner)
    AS->>DB: SELECT User
    PS->>PS: calcula valorFinalCentavos (desconto em R$ ou %)

    PS->>DB: BEGIN TRANSACTION (tx)
    PS->>DB: INSERT Processo (tx)
    PS->>CS: criarDeProcesso({...}, actorId, tx)
    CS->>DB: INSERT Cobranca (tipo=ESPORADICO, tx)
    CS->>DB: INSERT AuditLogFinanceiro (tx)
    PS->>DB: COMMIT

    PS-->>F: 201 Processo { valorFinal, ... }
    F-->>U: processo aparece no Kanban, cobrança já existe no Financeiro
```

Se `criarDeProcesso` lançar qualquer erro depois do `INSERT Processo`, a transação inteira é desfeita — não
existe cenário de "processo criado mas sem cobrança".

## 3. Mensalidade: cobrança virtual até o pagamento

Honorários recorrentes não geram uma linha no banco todo mês via cron — a cobrança do mês corrente só é
calculada quando alguém olha a lista, e só vira registro de verdade quando alguém a paga ou estorna.

```mermaid
sequenceDiagram
    actor U as Sócio/Funcionário
    participant F as Frontend (FinanceiroPage)
    participant CS as cobrancasService
    participant DB as Postgres (schema financeiro)

    U->>F: abre a tela Financeiro
    F->>CS: GET /api/v1/financeiro/cobrancas
    CS->>DB: SELECT Cobranca (reais, já gravadas)
    CS->>DB: SELECT Mensalidade WHERE ativo
    loop pra cada Mensalidade ativa
        CS->>DB: existe Cobranca com chaveMensal da competência atual?
        alt não existe ainda
            CS->>CS: monta item virtual (id = "virtual:empresa:competência")
        end
    end
    CS-->>F: [cobranças reais] + [cobranças virtuais] já ordenadas por vencimento

    Note over U,F: sócio recebe o pagamento de uma mensalidade (virtual)

    U->>F: registra pagamento na cobrança virtual
    F->>CS: POST /financeiro/cobrancas/virtual:.../pagamento
    CS->>DB: existe Cobranca com essa chaveMensal? (não)
    CS->>DB: INSERT Cobranca (status=PENDENTE) — materializa agora
    CS->>DB: UPDATE Cobranca SET status=PAGO, valorPago, formaPagamento, pagoEm
    CS->>DB: INSERT AuditLogFinanceiro (REGISTROU_PAGAMENTO)
    CS-->>F: 200 Cobranca atualizada
    F-->>U: mensalidade sai da lista de pendentes
```

## 4. Motor de Obrigações — do cadastro à Central de Pendências

O fluxo mais longo do sistema: três momentos separados (parametrizar a empresa, manter o catálogo, rodar o
motor) que convergem na mesma tela de trabalho.

```mermaid
sequenceDiagram
    actor S as Sócio
    participant EF as EmpresaDetail
    participant CAT as ObrigacaoTemplatesPage
    participant G as obrigacoesGeradorService
    participant EM as empresasService
    participant TR as obrigacaoTemplatesRepository
    participant DB as Postgres

    rect rgb(245, 245, 245)
    Note over S,DB: 1 — Parametrização fiscal (uma vez por empresa, módulo clientes)
    S->>EF: marca regime, natureza da atividade, 15 características
    EF->>DB: PATCH Empresa
    end

    rect rgb(245, 245, 245)
    Note over S,DB: 2 — Manutenção do catálogo (módulo processos, feito por um sócio)
    S->>CAT: cria/edita template (ex: "ICMS-ST", exigeIcmsSt=true, ativo=true)
    CAT->>DB: INSERT/UPDATE ObrigacaoTemplate
    end

    rect rgb(245, 245, 245)
    Note over S,DB: 3 — Geração (sob demanda, "Gerar obrigações do mês")
    S->>G: POST /obrigacoes/gerar { ownerId, competencia, empresaId? }
    G->>EM: list({ status: ATIVA }) — ou só a empresa informada
    EM->>DB: SELECT Empresa[]
    G->>TR: list({ ativo: true })
    TR->>DB: SELECT ObrigacaoTemplate[]

    loop cada empresa × cada template
        G->>G: regime bate? atividade bate? vigência cobre hoje?
        G->>G: todo exigeX do template tem possuiX=true na empresa?
        alt aplica E mês da competência está em mesesCompetencia
            G->>DB: já existe Obrigacao com essa chaveGeracao?
            alt não existe
                G->>G: calcula prazoLegal (dia-base + meses) e prazo interno
                G->>DB: INSERT Obrigacao (status=AGUARDANDO_DOCUMENTOS)
            else já existe
                G->>G: conta em "jaExistentes" (idempotente, não duplica)
            end
        end
    end
    G-->>S: { competencia, criadas, jaExistentes }
    end

    rect rgb(245, 245, 245)
    Note over S,DB: 4 — Acompanhamento (Central de Prazos / Pendências / Kanban)
    S->>DB: GET /obrigacoes?competencia=...&departamento=...
    DB-->>S: obrigações (manuais + geradas, mesma lista)
    S->>S: calcula "vencida" comparando prazo/prazoLegal com hoje (nunca gravado)
    S->>DB: PATCH status conforme o trabalho avança (Aguardando docs → ... → Concluída)
    end
```

Rodar o passo 3 de novo (ex: todo início de mês) é seguro — a chave única (`chaveGeracao`) impede
duplicação, então só as obrigações realmente novas daquela competência são criadas.

## 5. Biblioteca interna (Acervo) — link, nunca arquivo

Fluxo deliberadamente simples, sem upload nem OAuth:

```mermaid
sequenceDiagram
    actor U as Sócio/Funcionário
    participant F as Frontend (AcervoPage)
    participant AS as acervoService
    participant DB as Postgres (schema acervo)

    U->>F: cola o link do Drive + título/área/tipo
    F->>AS: POST /api/v1/acervo { titulo, area, url, ... }
    AS->>AS: valida URL (zod .url())
    AS->>DB: INSERT MaterialAcervo
    AS-->>F: 201 Material
    F-->>U: card aparece na lista, "Abrir ↗" leva direto pro Drive

    Note over F,DB: nenhuma credencial de Drive é solicitada, guardada ou usada —<br/>o sistema nunca baixa nem reenvia o arquivo em si.
```
