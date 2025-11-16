import WebSocket, { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';
import { WebSocketMessage, ConnectedClient } from '../types';

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ConnectedClient>;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.clients = new Map();

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log(`WebSocket server running on port ${port}`);
  }

  private handleConnection(ws: WebSocket) {
    const clientId = nanoid();
    const client: ConnectedClient = {
      id: clientId,
      boardIds: new Set(),
    };

    this.clients.set(ws, client);
    console.log(`Client connected: ${clientId}`);

    ws.on('message', (data: string) => {
      this.handleMessage(ws, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });

    // Send connection confirmation
    this.sendToClient(ws, {
      type: 'user_joined',
      payload: { clientId },
      timestamp: Date.now(),
    });
  }

  private handleMessage(ws: WebSocket, data: string) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(ws);

      if (!client) return;

      switch (message.type) {
        case 'join_board':
          this.handleJoinBoard(ws, client, message.payload.boardId);
          break;

        case 'leave_board':
          this.handleLeaveBoard(ws, client, message.payload.boardId);
          break;

        case 'task_updated':
        case 'task_created':
        case 'task_deleted':
        case 'task_moved':
        case 'board_updated':
          this.broadcastToBoard(message.payload.boardId, message, ws);
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private handleJoinBoard(ws: WebSocket, client: ConnectedClient, boardId: string) {
    client.boardIds.add(boardId);
    console.log(`Client ${client.id} joined board ${boardId}`);

    // Notify other clients in the board
    this.broadcastToBoard(
      boardId,
      {
        type: 'user_joined',
        payload: { userId: client.userId, boardId },
        timestamp: Date.now(),
      },
      ws
    );
  }

  private handleLeaveBoard(ws: WebSocket, client: ConnectedClient, boardId: string) {
    client.boardIds.delete(boardId);
    console.log(`Client ${client.id} left board ${boardId}`);

    // Notify other clients in the board
    this.broadcastToBoard(
      boardId,
      {
        type: 'user_left',
        payload: { userId: client.userId, boardId },
        timestamp: Date.now(),
      },
      ws
    );
  }

  private handleDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws);

    if (client) {
      // Notify all boards the user was in
      client.boardIds.forEach((boardId) => {
        this.broadcastToBoard(
          boardId,
          {
            type: 'user_left',
            payload: { userId: client.userId, boardId },
            timestamp: Date.now(),
          },
          ws
        );
      });

      console.log(`Client disconnected: ${client.id}`);
      this.clients.delete(ws);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcastToBoard(
    boardId: string,
    message: WebSocketMessage,
    excludeWs?: WebSocket
  ) {
    this.clients.forEach((client, ws) => {
      if (client.boardIds.has(boardId) && ws !== excludeWs) {
        this.sendToClient(ws, message);
      }
    });
  }

  // Public method to broadcast from external sources (e.g., HTTP API)
  public broadcast(boardId: string, message: WebSocketMessage) {
    this.broadcastToBoard(boardId, message);
  }

  public close() {
    this.wss.close();
  }
}

export default WebSocketManager;
