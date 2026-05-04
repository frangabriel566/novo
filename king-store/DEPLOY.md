# 🚀 KING STORE — Guia de Deploy Completo

## Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com)
- Conta no [GitHub](https://github.com)

---

## PASSO 1 — Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e clique em **"Start your project"**
2. Faça login com GitHub, Google ou email
3. Clique em **"New project"**
4. Preencha:
   - **Organization**: sua organização
   - **Project name**: `king-store`
   - **Database Password**: crie uma senha forte (salve ela!)
   - **Region**: escolha a mais próxima (ex: South America — São Paulo)
5. Clique em **"Create new project"** e aguarde ~2 minutos

---

## PASSO 2 — Obter a DATABASE_URL

Após criar o projeto:

1. No painel do Supabase, vá em **Settings → Database**
2. Role até **"Connection string"**
3. Selecione **"URI"** no dropdown
4. Você verá algo como:
   ```
   postgresql://postgres.[ref]:[senha]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```

5. Para **DATABASE_URL** (pooling — usado pelo app):
   - Adicione `?pgbouncer=true&connection_limit=1` ao final
   - Use a porta **6543**

6. Para **DIRECT_URL** (migrations):
   - Use a mesma string mas com porta **5432** e SEM o `?pgbouncer=true`

---

## PASSO 3 — Configurar o arquivo .env

Na raiz do projeto, crie o arquivo `.env`:

```env
# Conexão para o app (pooling via PgBouncer)
DATABASE_URL="postgresql://postgres.[SEU-REF]:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Conexão direta para migrations
DIRECT_URL="postgresql://postgres.[SEU-REF]:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# JWT Secret — troque por string aleatória longa
JWT_SECRET="mude-este-valor-para-producao-use-openssl-rand-base64-32"

# URL do app
NEXTAUTH_URL="http://localhost:3000"
```

> 💡 Para gerar um JWT_SECRET seguro, rode: `openssl rand -base64 32`

---

## PASSO 4 — Rodar o Projeto Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Gerar o Prisma Client
npm run db:generate

# 3. Rodar migrations (cria as tabelas no Supabase)
npm run db:migrate

# Quando perguntar o nome da migration, digite: init

# 4. Popular o banco com dados de exemplo
npm run db:seed

# 5. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

**Login padrão:**
- Email: `admin@kingstore.com`
- Senha: `admin123`

---

## PASSO 5 — Subir para o GitHub

```bash
# Na pasta do projeto
git init
git add .
git commit -m "feat: king store inicial"

# Crie um repositório no GitHub e depois:
git remote add origin https://github.com/SEU-USER/king-store.git
git branch -M main
git push -u origin main
```

---

## PASSO 6 — Deploy na Vercel

1. Acesse [https://vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Clique em **"Import Git Repository"**
4. Selecione o repositório `king-store`
5. Configure:
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `./` (deixe padrão)
6. Clique em **"Deploy"**

⚠️ O primeiro deploy pode falhar porque as variáveis de ambiente ainda não foram configuradas. Isso é normal.

---

## PASSO 7 — Configurar Variáveis de Ambiente na Vercel

1. No painel do projeto na Vercel, vá em **Settings → Environment Variables**
2. Adicione cada variável:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `DATABASE_URL` | sua connection string com pgbouncer | Production, Preview, Development |
| `DIRECT_URL` | sua connection string direta | Production, Preview, Development |
| `JWT_SECRET` | string aleatória segura | Production, Preview, Development |
| `NEXTAUTH_URL` | https://seu-app.vercel.app | Production |

3. Após adicionar todas, vá em **Deployments → Redeploy** para aplicar

---

## 🔧 Comandos Úteis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run db:studio    # Interface visual do banco (Prisma Studio)
npm run db:migrate   # Rodar migrations
npm run db:seed      # Popular banco com dados de exemplo
npm run db:generate  # Regenerar Prisma Client após mudanças no schema
```

---

## 📁 Estrutura do Projeto

```
king-store/
├── app/
│   ├── (auth)/           # Páginas de login e registro
│   ├── (dashboard)/      # Páginas protegidas
│   └── api/              # API Routes
├── components/
│   ├── ui/               # Componentes base
│   ├── layout/           # Sidebar e Header
│   ├── dashboard/        # Componentes do dashboard
│   ├── products/         # Formulário de produtos
│   ├── customers/        # Formulário de clientes
│   └── sales/            # Formulário de vendas
├── lib/
│   ├── prisma.ts         # Cliente Prisma singleton
│   ├── auth.ts           # JWT utilities
│   └── utils.ts          # Helpers
├── prisma/
│   ├── schema.prisma     # Schema do banco
│   └── seed.ts           # Dados iniciais
├── types/index.ts        # TypeScript types
└── middleware.ts         # Proteção de rotas
```

---

## 🐛 Troubleshooting

**Erro: "Cannot connect to database"**
- Verifique se a DATABASE_URL está correta
- Certifique-se de usar a porta 6543 para pooling
- Verifique se a senha não tem caracteres especiais que precisem ser encodados

**Erro: "JWT_SECRET is not defined"**
- Certifique-se de que o arquivo .env existe na raiz
- Reinicie o servidor após criar o .env

**Erro de migration: "P1001"**
- Use a DIRECT_URL (porta 5432) para migrations, não a pooling URL
- Verifique se o IP do seu computador não está bloqueado no Supabase

**Erro no deploy da Vercel: "Build failed"**
- Verifique se todas as variáveis de ambiente foram adicionadas
- O Prisma precisa do DATABASE_URL para gerar o client no build
