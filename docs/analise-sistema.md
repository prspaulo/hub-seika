# Análise do sistema atual (index.html)

> Levantamento feito em 2026-10-31 a partir do `index.html` existente, antes de iniciar a quebra em microserviços.

## O que o arquivo realmente é

Não é um único sistema — são **três aplicações inteiras empacotadas em um único HTML** (715KB, 100% client-side, sem backend nenhum):

1. **Shell principal** — "SEIKA | Central de Gestão": o sistema "de verdade" em uso — processos, clientes, financeiro, licenças, agenda, documentos, minutas societárias. Estado inteiro guardado em `localStorage` (`SEIKA_CENTRAL_V3`) + arquivos em `IndexedDB` (`SEIKA_FILES_V3`), tudo dentro do navegador.
2. **HUB_SOURCE** — "Seika HQ - Sistema Completo de Prospecção & Vendas", embutido em base64 (`atob()`) e carregado num `<iframe srcdoc>` (`.hubframe`). CRM/vendas, propostas, scripts de objeção, gamificação. Estado próprio em `localStorage` (`SEIKA_GAMIFIED_HQ_STATE`, `SEIKA_PRICES`, `SEIKA_EMAIL_SIGNATURE`), **não isolado por usuário**.
3. **ORIGINAL_SOURCE** — "Seika Soluções Empresariais | Painel Integrado v2.0", protótipo legado aberto via `openOriginal()` num modal. Calendário/Kanban/CRM/simulador tributário, mas **100% mock**, sem persistência nenhuma — serve só de referência visual/conteúdo.

Todas as três usam apenas CDNs públicos (Tailwind, xlsx.js, jszip, pdf.js, docx.js, FontAwesome, Google Fonts, canvas-confetti) e abrem links externos em nova aba (WhatsApp Web, Gmail, Drive, JUCEMG, Receita Federal). Não há API própria, não há rede além disso.

## Autenticação e roles hoje: não existem

O seletor "ESPAÇO DO SÓCIO" (`setUser()`) só troca uma variável em memória/localStorage e o texto do avatar. **Não há senha, não há sessão, não há isolamento de dados por sócio** — qualquer pessoa com acesso ao navegador vê e edita tudo de todos. O próprio sistema já expõe isso textualmente em `settings()`:

> "não há servidor, autenticação de sócios, dados compartilhados em tempo real nem segregação segura. Não use o seletor de perfil como controle de acesso."

No `ORIGINAL_SOURCE`, `changeUserRole()` apenas troca textos de badge na tela — também cosmético, sem controle de acesso algum.

## Funcionalidades por módulo × o que falta para produção

### Núcleo/Gestão (shell principal)

| Funcionalidade | Estado atual | O que precisa para ser real |
|---|---|---|
| Empresas/clientes (CNPJ, licenças, status) | `localStorage` | BD relacional (clientes, licenças), validação de CNPJ único, controle de concorrência (hoje é "last write wins") |
| Processos/serviços com cobrança vinculada | JS sequencial, sem transação | BD + regra transacional (criar processo e cobrança atomicamente) |
| Financeiro (mensalidades automáticas, pagamentos, estornos, despesas) | `state.audit` é só array local, perdível e editável | BD + trilha de auditoria imutável real |
| **Integração Cora** (boleto/Pix) | Citada em 3 lugares ("solicitar emissão Cora", "Pendente de integração"), **nunca implementada** | Credenciais de API, certificado, emissão idempotente, confirmação via webhook |
| Obrigações/prazos, Kanban, agenda (+ `.ics` manual) | Persistência local | Sincronia com Google Agenda/Gmail é citada como pendente — exigiria OAuth2 por sócio |
| Documentos por cliente | `IndexedDB` local do navegador (não sincroniza entre dispositivos/pessoas) | Storage central (S3/Blob) com permissão por cliente |
| Importação de planilhas/PDF/DOCX (xlsx/jszip/pdf.js) | Funcional 100% client-side | OK como está; falta OCR para PDF escaneado (admitido no próprio código) |
| Backup/Restore (.json/.zip) | Export/import manual do `localStorage`+`IndexedDB` | Não é backup de banco de dados real — precisa de backup de BD de verdade |
| "IA conectada" (`aiPriorities()`) / "Sincronizar agenda" (`syncAgenda()`) | **Apenas toasts de aviso "ainda não conectado"** | Funcionalidades 100% fachada — precisam de integração real se forem mantidas |
| Geração de minuta societária (contrato social/alteração/distrato) | Template de texto local, sem IA, sem validação jurídica | Manter como gerador de rascunho — revisão jurídica humana obrigatória antes de uso |
| Exportação Word/PDF (docx.js, `window.print`) | Funcional e real | Nenhuma mudança necessária, não depende de backend |

### HUB_SOURCE (prospecção/vendas, dentro do iframe)

Construtor de orçamento/proposta, geração de mensagens WhatsApp/e-mail, scripts de objeção, cronômetro de pitch, gamificação (XP/badges), tabela de preços editável, upload de assinatura de e-mail. Tudo client-side, `localStorage` sem isolar por usuário.

Para produção: migrar estado para BD com `owner_id` por registro. Importante notar: o envio de WhatsApp/e-mail hoje só monta o texto e abre o app externo — **não há envio automático, API do WhatsApp Business nem SMTP real**.

### ORIGINAL_SOURCE (painel legado v2.0)

Calendário, Kanban, CRM, simulador de viabilidade tributária (`calcularViabilidade`), gerador de minuta DREI — tudo com dados mock fixos, sem nenhuma persistência. Serve só como referência de layout/conteúdo; **não deve ser migrado como está**.

## O que é necessário para virar sistema real (resumo transversal)

- **Banco de dados real** (Postgres/MySQL) para: empresas, processos, pagamentos/despesas, obrigações, eventos de agenda, leads/CRM, campanhas, missões/gamificação, biblioteca/acervo, auditoria, documentos (metadados) — hoje tudo é um único blob JSON no `localStorage` de um navegador.
- **Autenticação real** (login + senha/SSO) com sessão por usuário — hoje é um `<select>` sem senha.
- **Autorização por papel (RBAC)** — sócio só vê/edita o que é dele (financeiro sensível, dados de clientes, minutas) vs. visão compartilhada; hoje não existe isolamento algum.
- **Armazenamento de arquivos centralizado** (S3/Blob) no lugar do `IndexedDB` do navegador, com controle de acesso por cliente/sócio.
- **Integrações externas reais**, todas hoje "não conectadas" por admissão do próprio sistema: Cora (cobrança/Pix/boleto), Google OAuth (Agenda, Gmail, Drive), IA com memória privada por usuário, fontes de notícias/Ads.
- **Trilha de auditoria imutável** (hoje é só um array local, perdível e editável).
- **Segurança**: sanitização de HTML já existe (`esc()`) e validação de URL (`safeUrl()`) no shell — pontos positivos reaproveitáveis; mas falta proteção contra acesso não autorizado, CSRF/XSS em camada de servidor, criptografia de dados sensíveis (CNPJ, financeiro) em repouso, rate limiting, etc., que só existem quando há backend.

## Dados sensíveis observados

- Nomes reais dos sócios aparecem hardcoded no shell e no `ORIGINAL_SOURCE`: `PauloGomes`, `MiltonAraujo`, `PauloRodrigues`, e "Milton Sacchetto" (nome completo) em `changeUserRole()`.
- Link direto de uma pasta real do Google Drive hardcoded em `settings()` — se esse link for compartilhado/publicado junto com o HTML, qualquer pessoa com acesso ao arquivo pode tentar abri-lo.
- CNPJs e e-mail/telefone em `hub_source.html`/`original_source.html` são claramente placeholders de exemplo (`joao@empresa.com.br`, `(19) 99999-9999`, CNPJs fictícios) — não é dado real de cliente.
- Nenhum dado de cliente real foi encontrado hardcoded (o estado inicial do shell começa vazio); o risco real é que, uma vez em uso, todos os dados de clientes/financeiro ficam só no navegador local, sem backup automático nem controle de quem acessa o computador.

## Proposta inicial de bounded contexts (para a quebra em microserviços)

- **Auth/Identity** — login real, sessão, RBAC (sócio vê o que é dele vs. compartilhado).
- **Clientes/Empresas** — cadastro, CNPJ, licenças.
- **Processos/Jurídico** — processos, obrigações, prazos, minutas (gerador de rascunho).
- **Financeiro** — mensalidades, pagamentos, despesas, estornos, auditoria, integração Cora.
- **Documentos** — upload/armazenamento central, metadados, permissão por cliente.
- **CRM/Vendas** (absorve o HUB) — leads, propostas, pipeline, gamificação.
- **Agenda/Notificações** — eventos, integração Google, e-mail/WhatsApp.
