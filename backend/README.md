# Backend Microservice

Microserviço backend do Task Management System usando Node.js, TypeScript, tRPC e Prisma.

## 🏗️ Estrutura

```
backend/
├── src/
│   ├── routers/          # tRPC routers
│   │   ├── users.ts      # Rotas de usuários
│   │   ├── boards.ts     # Rotas de boards
│   │   ├── tasks.ts      # Rotas de tarefas
│   │   ├── columns.ts    # Rotas de colunas
│   │   ├── labels.ts     # Rotas de labels
│   │   ├── analytics.ts  # Rotas de analytics
│   │   └── index.ts      # App router
│   ├── websocket/        # WebSocket server
│   │   └── server.ts
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilitários
│   │   ├── db.ts         # Prisma client
│   │   └── trpc.ts       # tRPC setup
│   ├── tests/            # Testes
│   └── index.ts          # Entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── Dockerfile
└── package.json
```

## 🚀 Scripts

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Testes
npm test
npm run test:watch
npm run test:integration

# Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio

# Lint
npm run lint
npm run type-check
```

## 📊 Database Schema

### Models

- **User** - Usuários do sistema
- **Board** - Quadros Kanban
- **BoardMember** - Membros de um board
- **Column** - Colunas do Kanban
- **Task** - Tarefas
- **Label** - Labels/Tags
- **TaskLabel** - Relação Task-Label
- **Comment** - Comentários em tarefas
- **Attachment** - Anexos
- **Notification** - Notificações
- **ActivityLog** - Log de atividades

## 🔌 API Endpoints

Todos os endpoints são acessados via tRPC em `/trpc`.

### Health Check
```
GET /health
```

## 🧪 Testes

```bash
# Todos os testes
npm test

# Com coverage
npm test -- --coverage

# Watch mode
npm run test:watch

# Apenas integration
npm run test:integration
```

## 🐳 Docker

```bash
# Build
docker build -t task-backend .

# Run
docker run -p 4000:4000 -p 4001:4001 task-backend
```
