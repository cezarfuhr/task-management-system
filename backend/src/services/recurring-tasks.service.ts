import cron from 'node-cron';
import { addDays, addWeeks, addMonths, addYears, startOfDay } from 'date-fns';
import prisma from '../utils/db';

export class RecurringTasksService {
  // Start cron job to process recurring tasks
  static startCronJob(): void {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('Processing recurring tasks...');
      await this.processRecurringTasks();
    });
  }

  // Process all active recurring tasks
  static async processRecurringTasks(): Promise<void> {
    const recurringTasks = await prisma.recurringTask.findMany({
      where: {
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
    });

    for (const recurring of recurringTasks) {
      const shouldCreate = await this.shouldCreateTask(recurring);
      if (shouldCreate) {
        await this.createTaskFromTemplate(recurring);
      }
    }
  }

  // Check if task should be created today
  private static async shouldCreateTask(recurring: any): Promise<boolean> {
    const today = startOfDay(new Date());
    const lastCreated = recurring.lastCreated ? startOfDay(new Date(recurring.lastCreated)) : null;

    // If never created, create now
    if (!lastCreated) return true;

    let nextDate: Date;

    switch (recurring.pattern) {
      case 'daily':
        nextDate = addDays(lastCreated, recurring.interval);
        break;
      case 'weekly':
        nextDate = addWeeks(lastCreated, recurring.interval);
        break;
      case 'monthly':
        nextDate = addMonths(lastCreated, recurring.interval);
        break;
      case 'yearly':
        nextDate = addYears(lastCreated, recurring.interval);
        break;
      default:
        return false;
    }

    return today >= nextDate;
  }

  // Create task from recurring template
  private static async createTaskFromTemplate(recurring: any): Promise<void> {
    const templateData = recurring.templateData as any;

    // Get max position in column
    const maxPosition = await prisma.task.aggregate({
      where: { columnId: templateData.columnId },
      _max: { position: true },
    });

    await prisma.task.create({
      data: {
        ...templateData,
        position: (maxPosition._max.position ?? -1) + 1,
        isRecurring: true,
        recurringTaskId: recurring.id,
        createdAt: new Date(),
      },
    });

    // Update lastCreated
    await prisma.recurringTask.update({
      where: { id: recurring.id },
      data: { lastCreated: new Date() },
    });
  }

  // Create recurring task
  static async createRecurringTask(data: {
    pattern: string;
    interval: number;
    templateData: any;
    endDate?: Date;
  }): Promise<any> {
    return prisma.recurringTask.create({
      data,
    });
  }

  // Stop recurring task
  static async stopRecurringTask(id: string): Promise<void> {
    await prisma.recurringTask.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
