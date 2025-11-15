import WebSocket from 'ws';
import WebSocketManager from '../../websocket/server';

// Mock WebSocket
jest.mock('ws');

describe('WebSocket Manager', () => {
  let wsManager: WebSocketManager;
  let mockWss: any;

  beforeEach(() => {
    mockWss = {
      on: jest.fn(),
      close: jest.fn(),
    };

    (WebSocket as any).Server = jest.fn().mockImplementation(() => mockWss);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize WebSocket server on given port', () => {
    wsManager = new WebSocketManager(4001);

    expect(WebSocket.Server).toHaveBeenCalledWith({ port: 4001 });
    expect(mockWss.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  it('should handle client connections', () => {
    wsManager = new WebSocketManager(4001);

    const connectionHandler = mockWss.on.mock.calls.find(
      (call: any) => call[0] === 'connection'
    )?.[1];

    expect(connectionHandler).toBeDefined();
  });

  it('should close WebSocket server', () => {
    wsManager = new WebSocketManager(4001);
    wsManager.close();

    expect(mockWss.close).toHaveBeenCalled();
  });
});
