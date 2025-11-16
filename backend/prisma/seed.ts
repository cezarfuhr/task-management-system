import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@taskmanagement.com' },
    update: {},
    create: {
      email: 'demo@taskmanagement.com',
      name: 'Demo User',
      password: hashedPassword,
      role: 'user',
      emailVerified: true,
    },
  });

  console.log('Created demo user:', demoUser.email);

  // Create demo board
  const board = await prisma.board.create({
    data: {
      title: 'Demo Project',
      description: 'This is a demo project to showcase the task management system',
      color: '#3B82F6',
      ownerId: demoUser.id,
      columns: {
        create: [
          { title: 'To Do', position: 0 },
          { title: 'In Progress', position: 1 },
          { title: 'Review', position: 2 },
          { title: 'Done', position: 3 },
        ],
      },
      labels: {
        create: [
          { name: 'Bug', color: '#EF4444' },
          { name: 'Feature', color: '#3B82F6' },
          { name: 'Documentation', color: '#10B981' },
          { name: 'Enhancement', color: '#F59E0B' },
        ],
      },
    },
    include: {
      columns: true,
      labels: true,
    },
  });

  console.log('Created demo board:', board.title);

  // Create demo tasks
  const todoColumn = board.columns.find((c) => c.title === 'To Do')!;
  const inProgressColumn = board.columns.find((c) => c.title === 'In Progress')!;

  await prisma.task.createMany({
    data: [
      {
        title: 'Setup development environment',
        description: 'Install all dependencies and configure the development environment',
        boardId: board.id,
        columnId: inProgressColumn.id,
        position: 0,
        priority: 'high',
        creatorId: demoUser.id,
        assigneeId: demoUser.id,
      },
      {
        title: 'Create user authentication flow',
        description: 'Implement login, register, and password reset functionality',
        boardId: board.id,
        columnId: todoColumn.id,
        position: 0,
        priority: 'urgent',
        creatorId: demoUser.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        title: 'Design database schema',
        description: 'Create Prisma schema for all entities',
        boardId: board.id,
        columnId: todoColumn.id,
        position: 1,
        priority: 'medium',
        creatorId: demoUser.id,
        estimatedHours: 8,
      },
    ],
  });

  console.log('Created demo tasks');

  // Create email preferences
  await prisma.emailPreference.create({
    data: {
      userId: demoUser.id,
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
