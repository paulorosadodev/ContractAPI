<img width="1913" height="674" alt="contractapi" src="https://github.com/user-attachments/assets/39b67aff-dbf3-44c8-9f33-32413f43d8c9" />

---

<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-WebSocket-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
</div>

<br />

**ContractAPI** é uma ferramenta visual para criar e documentar contratos de API antes de escrever código. Defina interfaces, types, enums e endpoints REST de forma colaborativa em tempo real.

## ✨ Funcionalidades

### 📦 Interfaces & Types

Crie interfaces e types TypeScript visualmente, com suporte a:

- Campos opcionais e obrigatórios
- Arrays de qualquer tipo
- Referências a outros objetos

### 📋 Enums

Defina enums para status, categorias e valores fixos com validação automática de nomenclatura (UPPER_SNAKE_CASE).

### 🌐 Endpoints

Configure endpoints REST completos com:

- Métodos HTTP (GET, POST, PUT, PATCH, DELETE)
- Path com parâmetros (`:id`, `:slug`)
- Query parameters tipados
- Request body e Response body em JSON
- Descrição do endpoint

### 📁 Coleções

Organize seus objetos e endpoints em coleções e subcoleções hierárquicas. Arraste e solte para reorganizar.

### 🛡️ Roles & Permissões

Defina roles ordenadas por hierarquia e associe permissões mínimas a cada endpoint para documentar autorizações.

### 🔄 Modos de Trabalho

**Modo Local (padrão):** Trabalhe individualmente com seus dados salvos no localStorage do navegador. Ideal para rascunhos e projetos pessoais.

**Modo Colaborativo:** Crie uma sessão e compartilhe o link com sua equipe. Todas as alterações são sincronizadas em tempo real via WebSocket entre todos os participantes.

### 📤 Export TypeScript

Exporte interfaces, types e enums prontos para copiar e colar no seu código.

### 👁️ Preview JSON

Visualize como seus objetos ficam em JSON com syntax highlighting.

### 👥 Sessões Colaborativas

Inicie uma sessão colaborativa e compartilhe o link com sua equipe. Cada sessão tem seu próprio espaço de dados isolado e sincronização em tempo real.

### 💾 Import/Export

Exporte toda a documentação em JSON e importe em outro ambiente.

### 🌙 Tema Claro/Escuro

Suporte a tema Dracula (dark) e tema claro inspirado no GitHub.

## 🏗️ Arquitetura

```
contract-api/
├── server/                    # Backend Node.js
│   ├── index.js              # Servidor Express + WebSocket
│   ├── services/
│   │   ├── dataService.js    # Lógica de negócio (CRUD global)
│   │   └── sessionService.js # Gerenciamento de sessões
│   ├── websocket/
│   │   ├── dataHandler.js    # Handlers legados (sem sessão)
│   │   └── sessionHandler.js # Handlers para sessões colaborativas
│   ├── types/
│   │   └── data.js           # Tipos e estrutura padrão
│   ├── utils/
│   │   ├── fileSystem.js     # Persistência em JSON
│   │   └── string.js         # Utilitários de string
│   └── data/
│       └── data.json         # Dados persistidos (modo legado)
│
├── src/                       # Frontend React
│   ├── App.tsx               # Roteamento Landing/Home
│   ├── pages/
│   │   ├── LandingPage.tsx   # Página de apresentação
│   │   └── HomePage.tsx      # Aplicação principal
│   ├── features/folders/
│   │   ├── components/       # Componentes da feature
│   │   ├── context/
│   │   │   └── SessionContext.tsx # Gerenciamento de sessões
│   │   ├── hooks/
│   │   │   ├── useFoldersWs.ts    # Hook WebSocket (colaborativo)
│   │   │   ├── useLocalData.ts    # Hook localStorage (local)
│   │   │   └── useSidebarResize.ts
│   │   ├── model/            # Tipos TypeScript
│   │   └── utils/            # Utilitários
│   ├── shared/
│   │   ├── components/       # Button, Input, Modal, Navbar, Dropdown
│   │   └── hooks/            # useTheme
│   └── layout/
│       └── AppLayout.tsx     # Layout base
│
└── index.html                # Entry point
```

## 🔌 Modos de Operação

O ContractAPI oferece dois modos de trabalho que se adequam a diferentes necessidades:

### 🏠 Modo Local

Por padrão, cada usuário trabalha individualmente com seus próprios dados salvos no **localStorage** do navegador. 

- ✅ Não requer conexão de rede
- ✅ Dados privados e locais
- ✅ Ideal para rascunhos e projetos pessoais
- ✅ Import/Export para compartilhar manualmente

### 👥 Modo Colaborativo

Clique no botão **"Colaborar"** para criar uma sessão e compartilhar o link com sua equipe.

- ✅ Sincronização em tempo real via WebSocket
- ✅ Múltiplos usuários trabalhando simultaneamente
- ✅ Cada sessão tem dados isolados na memória do servidor
- ✅ Sessões expiram após 30 minutos de inatividade
- ✅ ID único de 8 caracteres na URL

**Fluxo de Colaboração:**

```
1. Usuário A clica em "Colaborar" → cria sessão (ex: abc12345)
2. URL atualiza: http://localhost:3001?session=abc12345
3. Usuário A copia e compartilha o link
4. Usuários B, C, D abrem o link → entram na mesma sessão
5. Todos veem as alterações em tempo real
6. Qualquer um pode sair clicando em "Sair da Sessão"
7. Quando todos saem, a sessão expira em 30 minutos
```

## 🔌 Como Funciona o WebSocket (Modo Colaborativo)

### Fluxo de Comunicação

```
┌─────────────┐     WebSocket      ┌─────────────────┐
│  Cliente A  │ ◄────────────────► │    Servidor     │
│   (React)   │  ?session=abc123   │    (Node.js)    │
└─────────────┘                    └─────────────────┘
       │                                    │
       │                                    ▼
       │                           ┌────────────────┐
       │                           │  sessionService │
       │                           │   sessions = {  │
       │                           │    abc123: {    │
┌─────────────┐                    │      clients,   │
│  Cliente B  │                    │      dataStore  │
│   (React)   │ ◄──────────────────│    }            │
└─────────────┘  ?session=abc123   │   }             │
                                    └────────────────┘

1. Cliente conecta com ?session=abc123
2. Servidor busca/cria sessão abc123 no sessionService
3. Envia INIT com dataStore da sessão
4. Cliente envia ação (CREATE, UPDATE, etc)
5. Servidor atualiza dataStore da sessão
6. Broadcast DATA_UPDATE para todos clientes da sessão
```

### Tipos de Mensagens

**Cliente → Servidor:**

- `CREATE_COLLECTION` / `RENAME_COLLECTION` / `DELETE_COLLECTION` / `MOVE_COLLECTION`
- `CREATE_OBJECT` / `UPDATE_OBJECT` / `DELETE_OBJECT` / `MOVE_OBJECT`
- `CREATE_ENDPOINT` / `UPDATE_ENDPOINT` / `DELETE_ENDPOINT` / `MOVE_ENDPOINT`
- `CREATE_ROLE` / `RENAME_ROLE` / `DELETE_ROLE` / `REORDER_ROLES`
- `IMPORT_DATA`

**Servidor → Cliente:**

- `INIT` - Estado inicial ao conectar
- `DATA_UPDATE` - Atualização após qualquer mudança
- `CLIENT_COUNT` - Número de clientes conectados
- `ERROR` - Erro no processamento

### Persistência

**Modo Local:** Os dados são salvos automaticamente no `localStorage` do navegador sempre que há alterações.

**Modo Colaborativo:** Os dados ficam em memória no servidor durante a sessão ativa. Para persistir, use Export/Import ou integre um banco de dados.

## 🚀 Como Rodar

### Pré-requisitos

- [Bun](https://bun.sh/) (recomendado) ou Node.js 18+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/paulorosadodev/ContractAPI.git
cd ContractAPI/contract-api

# Instale as dependências
bun install
```

### Desenvolvimento

```bash
# Inicia servidor backend + frontend em paralelo
bun run dev
```

O servidor estará disponível em:

- **Frontend:** http://localhost:5173
- **Backend/WebSocket:** http://localhost:3001

### Produção

```bash
# Build do frontend
bun run build

# Inicia o servidor (serve o build estático)
bun run start
```

O servidor irá servir o frontend buildado e a API WebSocket na porta 3001.

### Acesso em Rede Local

O servidor escuta em `0.0.0.0`, permitindo acesso de outros dispositivos na mesma rede usando o IP da máquina:

```
http://192.168.x.x:3001
```

## 📜 Scripts Disponíveis

| Script           | Descrição                             |
| ---------------- | ------------------------------------- |
| `bun run dev`    | Inicia backend e frontend em paralelo |
| `bun run server` | Inicia apenas o backend               |
| `bun run client` | Inicia apenas o frontend (Vite)       |
| `bun run build`  | Build de produção                     |
| `bun run start`  | Inicia servidor de produção           |
| `bun run lint`   | Executa ESLint                        |
| `bun run format` | Formata código com Prettier           |

## 🛠️ Stack Tecnológica

### Frontend

- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Vite** - Build tool

### Backend

- **Node.js** - Runtime
- **Express** - HTTP server
- **ws** - WebSocket library

### Fontes

- **JetBrains Mono** - Monospace font

## 🎨 Temas

O ContractAPI suporta dois temas:

### Dracula (Dark) - Padrão

Tema escuro com cores vibrantes, ideal para longas sessões de trabalho.

### GitHub (Light)

Tema claro inspirado na interface do GitHub.

O tema é persistido no localStorage e pode ser alternado pelo botão na navbar.

## 📝 Licença

MIT © [Paulo Rosado](https://github.com/paulorosadodev)

---

<div align="center">
  <sub>Feito com ❤️ por devs para devs</sub>
</div>
