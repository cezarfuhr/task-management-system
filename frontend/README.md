# Frontend Microservice

Microserviço frontend do Task Management System usando Next.js 14, TypeScript e Tailwind CSS.

## 🏗️ Estrutura

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx      # Home (lista de boards)
│   │   ├── providers.tsx
│   │   ├── boards/
│   │   │   └── [id]/
│   │   │       └── page.tsx  # Kanban board
│   │   ├── calendar/
│   │   │   └── page.tsx      # Calendar view
│   │   └── analytics/
│   │       └── page.tsx      # Analytics
│   ├── components/       # React components
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── TaskCard.tsx
│   │   ├── CreateBoardModal.tsx
│   │   ├── CreateTaskModal.tsx
│   │   └── ThemeToggle.tsx
│   ├── lib/              # Utilities
│   │   ├── trpc.ts       # tRPC client
│   │   ├── websocket.ts  # WebSocket hook
│   │   └── utils.ts
│   ├── hooks/            # React hooks
│   │   └── useTheme.ts
│   ├── types/            # TypeScript types
│   ├── styles/           # CSS
│   │   └── globals.css
│   └── tests/            # Tests
├── public/               # Static files
├── Dockerfile
├── next.config.js
├── tailwind.config.js
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
npm run test:ci

# Lint
npm run lint
npm run type-check
```

## 🎨 Componentes Principais

### KanbanBoard
Componente principal do board com drag-and-drop usando @dnd-kit.

### TaskCard
Cartão de tarefa com informações de prioridade, labels, datas e atribuição.

### ThemeToggle
Toggle entre temas claro/escuro/sistema.

## 🧪 Testes

```bash
# Executar testes
npm test

# Com coverage
npm run test:ci

# Watch mode
npm run test:watch
```

## 🐳 Docker

```bash
# Build
docker build -t task-frontend .

# Run
docker run -p 3000:3000 task-frontend
```

## 📱 Páginas

- `/` - Lista de boards
- `/boards/[id]` - Kanban board
- `/calendar` - Visualização de calendário
- `/analytics` - Analytics e relatórios
