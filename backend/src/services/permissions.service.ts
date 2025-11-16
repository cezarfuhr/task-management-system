import prisma from '../utils/db';
import { TRPCError } from '@trpc/server';

export type Resource = 'board' | 'column' | 'task';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'move';
export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export class PermissionsService {
  // Default permissions matrix
  private static DEFAULT_PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
    owner: {
      board: ['create', 'read', 'update', 'delete'],
      column: ['create', 'read', 'update', 'delete', 'move'],
      task: ['create', 'read', 'update', 'delete', 'move'],
    },
    admin: {
      board: ['read', 'update'],
      column: ['create', 'read', 'update', 'delete', 'move'],
      task: ['create', 'read', 'update', 'delete', 'move'],
    },
    member: {
      board: ['read'],
      column: ['read'],
      task: ['create', 'read', 'update', 'move'],
    },
    viewer: {
      board: ['read'],
      column: ['read'],
      task: ['read'],
    },
  };

  // Check if user has permission
  static async hasPermission(
    userId: string,
    boardId: string,
    resource: Resource,
    action: Action
  ): Promise<boolean> {
    // Check if user is board owner
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: userId,
      },
    });

    if (board) return true;

    // Check if user is member and get role
    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
      },
    });

    if (!member) return false;

    // Check custom permissions first
    const customPermission = await prisma.boardPermission.findFirst({
      where: {
        boardId,
        resource,
        action,
        role: member.role,
      },
    });

    if (customPermission) return true;

    // Check default permissions
    const role = member.role as Role;
    const defaultPermissions = this.DEFAULT_PERMISSIONS[role];

    if (!defaultPermissions) return false;

    return defaultPermissions[resource]?.includes(action) || false;
  }

  // Require permission (throws error if not authorized)
  static async requirePermission(
    userId: string,
    boardId: string,
    resource: Resource,
    action: Action
  ): Promise<void> {
    const hasPermission = await this.hasPermission(userId, boardId, resource, action);

    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You don't have permission to ${action} ${resource}`,
      });
    }
  }

  // Get user role in board
  static async getUserRole(userId: string, boardId: string): Promise<Role | null> {
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: userId,
      },
    });

    if (board) return 'owner';

    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
      },
    });

    return member?.role as Role || null;
  }

  // Set custom permission
  static async setPermission(
    boardId: string,
    resource: Resource,
    action: Action,
    role: Role
  ): Promise<void> {
    await prisma.boardPermission.upsert({
      where: {
        boardId_resource_action_role: {
          boardId,
          resource,
          action,
          role,
        },
      },
      update: {},
      create: {
        boardId,
        resource,
        action,
        role,
      },
    });
  }
}
