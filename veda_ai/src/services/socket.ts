type SocketEventCallback = (data: any) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<SocketEventCallback>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private url: string = "";

  connect(url: string = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080") {
    if (this.socket) {
      return;
    }
    this.url = url;
    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log("WebSocket connected to", url);
        this.emitInternal("connect", null);
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.event) {
            this.emitInternal(parsed.event, parsed.data);
          }
        } catch (err) {
          console.warn("WebSocket failed to parse message data", event.data);
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket connection error:", error);
      };

      this.socket.onclose = () => {
        console.log("WebSocket connection closed. Attempting reconnect in 5s...");
        this.socket = null;
        this.emitInternal("disconnect", null);
        this.reconnectTimeout = setTimeout(() => this.connect(this.url), 5000);
      };
    } catch (err) {
      console.error("Failed to initialize WebSocket:", err);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  on(event: string, callback: SocketEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscriber function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  emit(event: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    } else {
      console.warn("WebSocket is not connected. Message queued or dropped:", { event, data });
    }
  }

  private emitInternal(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }
}

export const socketService = new SocketService();
