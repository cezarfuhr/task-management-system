import nodemailer from 'nodemailer';
import prisma from '../utils/db';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@taskmanagement.com';
const FROM_NAME = process.env.FROM_NAME || 'Task Management System';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export class EmailService {
  // Send email
  static async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    try {
      await transporter.sendMail({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  // Send task assigned notification
  static async sendTaskAssignedEmail(taskId: string, assigneeId: string): Promise<void> {
    const [task, assignee, preferences] = await Promise.all([
      prisma.task.findUnique({
        where: { id: taskId },
        include: {
          board: true,
          creator: true,
        },
      }),
      prisma.user.findUnique({ where: { id: assigneeId } }),
      prisma.emailPreference.findUnique({ where: { userId: assigneeId } }),
    ]);

    if (!task || !assignee || preferences?.taskAssigned === false) return;

    const html = `
      <h2>You've been assigned a task</h2>
      <p>Hi ${assignee.name},</p>
      <p>${task.creator.name} has assigned you to a task:</p>
      <h3>${task.title}</h3>
      <p>${task.description || ''}</p>
      <p>
        <a href="${APP_URL}/boards/${task.boardId}?task=${taskId}"
           style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Task
        </a>
      </p>
    `;

    await this.sendEmail(assignee.email, 'New Task Assigned', html);
  }

  // Send comment notification
  static async sendCommentNotification(commentId: string): Promise<void> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            board: true,
            assignee: true,
          },
        },
        user: true,
      },
    });

    if (!comment || !comment.task.assignee) return;

    const preferences = await prisma.emailPreference.findUnique({
      where: { userId: comment.task.assignee.id },
    });

    if (preferences?.commentAdded === false) return;

    const html = `
      <h2>New comment on your task</h2>
      <p>Hi ${comment.task.assignee.name},</p>
      <p>${comment.user.name} commented on task "${comment.task.title}":</p>
      <blockquote style="border-left: 3px solid #3B82F6; padding-left: 10px; color: #666;">
        ${comment.content}
      </blockquote>
      <p>
        <a href="${APP_URL}/boards/${comment.task.boardId}?task=${comment.taskId}"
           style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Task
        </a>
      </p>
    `;

    await this.sendEmail(comment.task.assignee.email, 'New Comment', html);
  }

  // Send due date reminder
  static async sendDueDateReminder(taskId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        board: true,
        assignee: true,
      },
    });

    if (!task || !task.assignee || !task.dueDate) return;

    const preferences = await prisma.emailPreference.findUnique({
      where: { userId: task.assignee.id },
    });

    if (preferences?.dueDateReminder === false) return;

    const dueDate = new Date(task.dueDate);
    const formattedDate = dueDate.toLocaleDateString();

    const html = `
      <h2>Task Due Date Reminder</h2>
      <p>Hi ${task.assignee.name},</p>
      <p>This is a reminder that your task is due soon:</p>
      <h3>${task.title}</h3>
      <p><strong>Due Date:</strong> ${formattedDate}</p>
      <p>
        <a href="${APP_URL}/boards/${task.boardId}?task=${taskId}"
           style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Task
        </a>
      </p>
    `;

    await this.sendEmail(task.assignee.email, 'Task Due Date Reminder', html);
  }

  // Send weekly digest
  static async sendWeeklyDigest(userId: string): Promise<void> {
    const [user, preferences, tasks] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.emailPreference.findUnique({ where: { userId } }),
      prisma.task.findMany({
        where: {
          OR: [{ assigneeId: userId }, { creatorId: userId }],
          isArchived: false,
        },
        include: {
          board: true,
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    if (!user || preferences?.weeklyDigest === false) return;

    const tasksHtml = tasks
      .slice(0, 10)
      .map(
        (task) => `
      <li>
        <strong>${task.title}</strong> - ${task.board.title}
        ${task.dueDate ? `(Due: ${new Date(task.dueDate).toLocaleDateString()})` : ''}
      </li>
    `
      )
      .join('');

    const html = `
      <h2>Your Weekly Task Summary</h2>
      <p>Hi ${user.name},</p>
      <p>Here's a summary of your tasks for this week:</p>
      <ul>
        ${tasksHtml || '<li>No tasks assigned</li>'}
      </ul>
      <p>
        <a href="${APP_URL}"
           style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Go to Dashboard
        </a>
      </p>
    `;

    await this.sendEmail(user.email, 'Weekly Task Summary', html);
  }
}
