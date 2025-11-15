import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export function useWebSocket(boardId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!boardId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001';
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');

      // Join board room
      ws.current?.send(
        JSON.stringify({
          type: 'join_board',
          payload: { boardId },
        })
      );
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.current && boardId) {
        ws.current.send(
          JSON.stringify({
            type: 'leave_board',
            payload: { boardId },
          })
        );
        ws.current.close();
      }
    };
  }, [boardId]);

  const sendMessage = (message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          ...message,
          timestamp: Date.now(),
        })
      );
    }
  };

  return { isConnected, lastMessage, sendMessage };
}
