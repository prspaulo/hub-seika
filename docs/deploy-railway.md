# Publicando o SEIKA no Railway

> Guia operacional de deploy. Para entender a arquitetura do sistema em si, veja
> [`arquitetura.md`](./arquitetura.md).

## Visão geral

O Railway vai hospedar **3 serviços** dentro de 1 projeto:

1. **Postgres** (plugin gerenciado do próprio Railway).
2. **backend** — API Fastify, Root Directory `backend/`.
3. **frontend** — SPA React servida como build estático, Root Directory `frontend/`.

Não é preciso usar os `Dockerfile.dev` que já existem (são só pro ambiente local com
hot-reload) — o Railway detecta Node.js automaticamente (Nixpacks) e usa os scripts
`build`/`start` de cada `package.json`, que já foram ajustados para produção.

## Passo a passo

### 1. Criar o projeto e o Postgres

No [Railway](https://railway.app): **New Project** → **Provision PostgreSQL**. Isso cria a
variável `DATABASE_URL` dentro do serviço Postgres, que os outros serviços vão referenciar.

### 2. Backend

**New Service → Deploy from GitHub repo** → selecione este repositório.

Em **Settings** do serviço:
- **Root Directory**: `backend`
- Build/Start: não precisa mexer — Nixpacks usa `npm run build` e `npm run start`
  automaticamente (ambos já existem no `package.json`).

Em **Variables**, adicione:
| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referência ao plugin, não digite a string) |
| `JWT_SECRET` | um valor novo e aleatório (ex: `openssl rand -hex 32`) — **nunca** reaproveite `dev-only-change-me-before-production` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | a URL pública do frontend (só dá pra preencher depois do passo 3 — deixe um placeholder e volte aqui) |

`PORT` não precisa ser setado — o Railway injeta automaticamente e o código já lê
`process.env.PORT` (`backend/src/index.ts`).

Ao fazer deploy, o `start` do backend roda `prisma migrate deploy` antes de subir o
servidor (`backend/package.json`) — ou seja, toda vez que você sobe uma versão nova com
migração pendente, ela é aplicada automaticamente no Postgres do Railway. Não é preciso
rodar `prisma migrate deploy` manualmente.

Depois do primeiro deploy, gere um domínio público em **Settings → Networking → Generate
Domain** e anote a URL (ex: `seika-backend-production.up.railway.app`).

### 3. Frontend

**New Service → Deploy from GitHub repo** (mesmo repositório, outro serviço).

Em **Settings**:
- **Root Directory**: `frontend`

Em **Variables**:
| Variável | Valor |
|---|---|
| `VITE_API_URL` | a URL pública do backend do passo 2 (ex: `https://seika-backend-production.up.railway.app`) |

**Importante**: variáveis `VITE_*` são embutidas no bundle estático **no momento do
build**, não lidas em runtime. Se você mudar `VITE_API_URL` depois, precisa fazer um novo
deploy do frontend (redeploy) pra reconstruir o bundle — só reiniciar o serviço não basta.

Gere o domínio público do frontend também (**Settings → Networking → Generate Domain**) e
**volte no backend** pra preencher `CORS_ORIGIN` com essa URL (com `https://`, sem barra
no final), depois reinicie o serviço do backend pra pegar a variável nova.

### 4. Popular um usuário inicial

O seed (`npm run seed`) cria dados fictícios de demonstração — normalmente você **não**
quer isso em produção. Em vez disso, crie o primeiro sócio diretamente no Postgres do
Railway (aba **Data** do plugin, ou `railway run` com o CLI) com uma senha com hash
bcrypt, do mesmo jeito que foi feito uma vez em desenvolvimento nesta sessão. Se preferir,
posso gerar esse script quando for a hora.

## Ajustes feitos no código para o deploy funcionar

Três coisas que **quebrariam silenciosamente** em produção no Railway e foram corrigidas
nesta sessão:

1. **Cookie de refresh token com `SameSite=Lax`** (`backend/src/modules/auth/routes.ts`) —
   em produção o frontend e o backend ficam em subdomínios `*.up.railway.app`
   diferentes, o que o navegador trata como cross-site. Cookies `Lax` não são enviados em
   `fetch`/`XHR` cross-site (só em navegação de página inteira), então o
   `POST /auth/refresh` nunca receberia o cookie e todo usuário seria deslogado 15 minutos
   após o login. Corrigido para usar `SameSite=None` (exige `Secure`, que já é `true` em
   produção) quando `NODE_ENV=production`.
2. **Vite 8 bloqueia hosts desconhecidos no `vite preview`** (`frontend/vite.config.ts`) —
   proteção contra DNS rebinding que rejeita qualquer `Host` fora de uma allowlist. Sem
   isso, toda requisição via `*.up.railway.app` voltaria como "Blocked request". Adicionado
   `preview.allowedHosts: true`.
3. **Prisma Client desatualizado após `npm install`** (`backend/package.json`) — adicionado
   `postinstall: "prisma generate"`, pra garantir que o client gerado sempre reflita o
   schema atual tanto no build do Railway quanto em instalações locais no host.

## Depois do primeiro deploy

- Teste login, refresh (espere token de acesso expirar — 15 min — e navegue) e logout
  direto na URL pública do frontend antes de considerar liberado para uso real.
- O Financeiro e o Motor de Obrigações não têm nenhuma dependência de ambiente além de
  `DATABASE_URL` — nada adicional a configurar ali.
- Scale/custo: os 3 serviços juntos cabem tranquilamente no plano de entrada do Railway
  para o volume de uso de um escritório pequeno/médio.
