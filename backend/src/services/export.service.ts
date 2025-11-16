import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import prisma from '../utils/db';

export class ExportService {
  // Export tasks to CSV
  static async exportTasksToCSV(boardId: string): Promise<string> {
    const tasks = await prisma.task.findMany({
      where: { boardId },
      include: {
        assignee: true,
        column: true,
        labels: {
          include: { label: true },
        },
      },
    });

    const data = tasks.map((task) => ({
      ID: task.id,
      Title: task.title,
      Description: task.description || '',
      Column: task.column.title,
      Priority: task.priority,
      Status: task.status,
      Assignee: task.assignee?.name || 'Unassigned',
      DueDate: task.dueDate?.toISOString() || '',
      EstimatedHours: task.estimatedHours || '',
      ActualHours: task.actualHours || '',
      Labels: task.labels.map((l) => l.label.name).join(', '),
      CreatedAt: task.createdAt.toISOString(),
    }));

    const parser = new Parser();
    return parser.parse(data);
  }

  // Export board to PDF
  static async exportBoardToPDF(boardId: string): Promise<Buffer> {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          include: {
            tasks: {
              where: { isArchived: false },
              include: {
                assignee: true,
                labels: { include: { label: true } },
              },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!board) throw new Error('Board not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).text(board.title, { align: 'center' });
      doc.moveDown();

      if (board.description) {
        doc.fontSize(12).text(board.description);
        doc.moveDown();
      }

      // Columns and tasks
      board.columns.forEach((column) => {
        doc.fontSize(16).fillColor(column.color || '#000').text(column.title);
        doc.moveDown(0.5);

        if (column.tasks.length === 0) {
          doc.fontSize(10).fillColor('#666').text('No tasks');
        } else {
          column.tasks.forEach((task) => {
            doc.fontSize(12).fillColor('#000').text(`• ${task.title}`);
            if (task.assignee) {
              doc.fontSize(9).fillColor('#666').text(`  Assignee: ${task.assignee.name}`);
            }
            doc.moveDown(0.3);
          });
        }

        doc.moveDown();
      });

      doc.end();
    });
  }
}
