# Task Management System

Sistema completo de gerenciamento de projetos e tarefas com Kanban board, calendário e colaboração em tempo real.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)
![Tests](https://img.shields.io/badge/Tests-Jest-green)

## 📋 Recursos

- **📊 Kanban Board Interativo** - Arrastar e soltar tarefas entre colunas
- **📅 Calendário Integrado** - Visualize tarefas por data de vencimento
- **👥 Colaboração em Tempo Real** - WebSocket para atualizações instantâneas
- **🔔 Sistema de Notificações** - Notificações de atribuição e comentários
- **📈 Relatórios de Produtividade** - Analytics e métricas de desempenho
- **🎨 Temas Customizáveis** - Suporte para dark mode e temas personalizados
- **🔒 Type-Safe APIs** - tRPC para APIs completamente tipadas
- **🧪 Totalmente Testado** - Cobertura de testes unitários e de integração

## 🏗️ Arquitetura

Este projeto utiliza uma arquitetura de microserviços com:

```
task-management-system/
├── backend/              # Microserviço Backend (Node.js + tRPC)
│   ├── src/
│   │   ├── routers/     # Rotas tRPC
│   │   ├── services/    # Lógica de negócio
│   │   ├── websocket/   # Servidor WebSocket
│   │   └── tests/       # Testes unitários
│   └── prisma/          # Schema do banco de dados
├── frontend/            # Microserviço Frontend (Next.js 14)
│   ├── src/
│   │   ├── app/        # App Router (Next.js 14)
│   │   ├── components/ # Componentes React
│   │   ├── lib/        # Utilitários e configurações
│   │   └── tests/      # Testes de componentes
└── docker-compose.yml  # Orquestração de serviços
```

## 🚀 Tecnologias

### Backend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **tRPC** - APIs type-safe end-to-end
- **Prisma** - ORM para PostgreSQL
- **WebSocket (ws)** - Comunicação em tempo real
- **Express** - Servidor HTTP
- **Zod** - Validação de schemas

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **@dnd-kit** - Biblioteca drag-and-drop
- **TanStack Query** - Cache e sincronização de dados
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones

### Infraestrutura
- **Docker & Docker Compose** - Containerização
- **PostgreSQL** - Banco de dados relacional
- **Jest** - Framework de testes
- **ESLint** - Linter

## 📦 Instalação e Execução

### Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 20+ (para desenvolvimento local)
- npm ou yarn

### Usando Docker Compose (Recomendado)

1. Clone o repositório:
```bash
git clone <repository-url>
cd task-management-system
```

2. Crie os arquivos `.env`:

**backend/.env**
```env
DATABASE_URL="postgresql://taskuser:taskpassword@postgres:5432/taskmanagement?schema=public"
PORT=4000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000
WS_PORT=4001
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4001
```

3. Inicie os serviços:

```bash
# Produção
docker-compose up -d

# Desenvolvimento (com hot reload)
docker-compose -f docker-compose.dev.yml up
```

4. Execute as migrações do banco de dados:

```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed  # Opcional: dados de exemplo
```

5. Acesse a aplicação:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- WebSocket: ws://localhost:4001

### Desenvolvimento Local

#### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testes

### Backend

```bash
cd backend

# Executar todos os testes
npm test

# Testes com coverage
npm run test -- --coverage

# Testes em watch mode
npm run test:watch
```

### Frontend

```bash
cd frontend

# Executar todos os testes
npm run test:ci

# Testes em watch mode
npm test
```

## 📚 API Documentation

### tRPC Endpoints

#### Users
- `users.me` - Obter usuário atual
- `users.updateSettings` - Atualizar configurações do usuário
- `users.getNotifications` - Obter notificações
- `users.markNotificationRead` - Marcar notificação como lida

#### Boards
- `boards.getAll` - Listar todos os boards
- `boards.getById` - Obter board por ID
- `boards.create` - Criar novo board
- `boards.update` - Atualizar board
- `boards.delete` - Deletar board
- `boards.addMember` - Adicionar membro ao board
- `boards.removeMember` - Remover membro do board

#### Tasks
- `tasks.getById` - Obter task por ID
- `tasks.getByBoard` - Listar tasks de um board
- `tasks.getByDateRange` - Listar tasks por período (para calendário)
- `tasks.create` - Criar nova task
- `tasks.update` - Atualizar task
- `tasks.move` - Mover task entre colunas
- `tasks.delete` - Deletar task
- `tasks.addComment` - Adicionar comentário
- `tasks.updateComment` - Atualizar comentário
- `tasks.deleteComment` - Deletar comentário

#### Columns
- `columns.getByBoard` - Listar colunas de um board
- `columns.create` - Criar nova coluna
- `columns.update` - Atualizar coluna
- `columns.move` - Reordenar coluna
- `columns.delete` - Deletar coluna

#### Labels
- `labels.getByBoard` - Listar labels de um board
- `labels.create` - Criar nova label
- `labels.update` - Atualizar label
- `labels.delete` - Deletar label

#### Analytics
- `analytics.getBoardStats` - Estatísticas do board
- `analytics.getProductivityMetrics` - Métricas de produtividade
- `analytics.getActivityTimeline` - Timeline de atividades
- `analytics.getUserPerformance` - Performance do usuário

### WebSocket Events

#### Client → Server
```typescript
{
  type: 'join_board',
  payload: { boardId: string }
}

{
  type: 'leave_board',
  payload: { boardId: string }
}
```

#### Server → Client
```typescript
{
  type: 'task_updated' | 'task_created' | 'task_deleted' | 'task_moved' | 'board_updated',
  payload: any,
  timestamp: number
}

{
  type: 'user_joined' | 'user_left',
  payload: { userId: string, boardId: string },
  timestamp: number
}
```

## 🎯 Funcionalidades Principais

### 1. Kanban Board
- Drag and drop de tarefas entre colunas
- Criação rápida de tarefas
- Visualização de prioridade e labels
- Contadores de comentários e anexos
- Atribuição de responsáveis

### 2. Calendário
- Visualização mensal de tarefas
- Filtro por data de vencimento
- Navegação entre meses
- Indicadores de prioridade

### 3. Analytics
- Total de boards e tarefas
- Taxa de conclusão
- Precisão de estimativas
- Métricas de produtividade

### 4. Colaboração em Tempo Real
- Atualizações instantâneas via WebSocket
- Notificações de mudanças
- Presença de usuários online

## 🔐 Segurança

- Validação de entrada com Zod
- Type-safety com TypeScript
- Sanitização de queries SQL via Prisma
- CORS configurado
- Autenticação por headers (pronto para JWT)

## 🚢 Deploy

### Usando Docker

```bash
# Build das imagens
docker-compose build

# Iniciar em produção
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### Variáveis de Ambiente - Produção

Certifique-se de configurar:

- `DATABASE_URL` - String de conexão PostgreSQL
- `CORS_ORIGIN` - URL do frontend
- `NEXT_PUBLIC_API_URL` - URL da API backend
- `NEXT_PUBLIC_WS_URL` - URL do WebSocket

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autores

- Sistema desenvolvido como demonstração de arquitetura de microserviços

## 🙏 Agradecimentos

- Next.js Team
- tRPC Contributors
- Prisma Team
- Tailwind CSS Team
- DnD Kit Contributors
