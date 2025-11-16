import { Client as MinioClient } from 'minio';
import { nanoid } from 'nanoid';
import prisma from '../utils/db';
import { TRPCError } from '@trpc/server';

const minioClient = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'task-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

export class FileUploadService {
  // Initialize bucket
  static async initialize(): Promise<void> {
    try {
      const exists = await minioClient.bucketExists(BUCKET_NAME);
      if (!exists) {
        await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
        console.log(`Bucket ${BUCKET_NAME} created successfully`);
      }
    } catch (error) {
      console.error('Error initializing MinIO bucket:', error);
    }
  }

  // Upload file
  static async uploadFile(
    file: Express.Multer.File,
    taskId: string,
    userId: string
  ): Promise<any> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'File size exceeds 10MB limit',
      });
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'File type not allowed',
      });
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const filename = `${nanoid()}.${fileExtension}`;
    const key = `${taskId}/${filename}`;

    try {
      // Upload to MinIO
      await minioClient.putObject(BUCKET_NAME, key, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });

      // Get presigned URL (valid for 7 days)
      const url = await minioClient.presignedGetObject(BUCKET_NAME, key, 7 * 24 * 60 * 60);

      // Save to database
      const attachment = await prisma.attachment.create({
        data: {
          filename,
          originalName: file.originalname,
          url,
          key,
          mimeType: file.mimetype,
          size: file.size,
          taskId,
          uploadedBy: userId,
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return attachment;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to upload file',
      });
    }
  }

  // Delete file
  static async deleteFile(attachmentId: string, userId: string): Promise<void> {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Attachment not found' });
    }

    // Check permission (owner or task creator)
    const task = await prisma.task.findUnique({
      where: { id: attachment.taskId },
      select: { creatorId: true },
    });

    if (attachment.uploadedBy !== userId && task?.creatorId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No permission to delete this file' });
    }

    try {
      // Delete from MinIO
      await minioClient.removeObject(BUCKET_NAME, attachment.key);

      // Delete from database
      await prisma.attachment.delete({
        where: { id: attachmentId },
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete file',
      });
    }
  }

  // Get file URL
  static async getFileUrl(attachmentId: string): Promise<string> {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Attachment not found' });
    }

    // Generate new presigned URL (valid for 1 hour)
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      attachment.key,
      60 * 60
    );

    return url;
  }

  // List files for task
  static async listTaskFiles(taskId: string): Promise<any[]> {
    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attachments;
  }
}

// Initialize on module load
FileUploadService.initialize();
