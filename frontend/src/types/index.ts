export interface Task {
  id: string;
  title: string;
  description?: string;
  boardId: string;
  columnId: string;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  assigneeId?: string;
  creatorId: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  title: string;
  boardId: string;
  position: number;
  color?: string;
  tasks?: Task[];
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  color: string;
  ownerId: string;
  isArchived: boolean;
  columns: Column[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  theme: 'light' | 'dark' | 'system';
}

export interface Label {
  id: string;
  name: string;
  color: string;
  boardId: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
}
