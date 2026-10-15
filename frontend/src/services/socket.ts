type SocketEventCallback = (data: any) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<SocketEventCallback>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private url: string = "";
  private queue: { event: string; data: any }[] = [];
  private intentionalClose = false;
  private authFailed = false;
  private connecting = false;

  connect(url: string = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000") {
    // `connecting` matters now that opening is async: several components call
    // connect() on mount, and without this guard they would each race past the
    // `this.socket` check while the first ticket request was still in flight.
    if (this.socket || this.connecting) {
      return;
    }
    this.connecting = true;
    // Fresh connection attempt — clear stop flags.
    this.intentionalClose = false;
    this.authFailed = false;
    let normalizedUrl = url;
    if (normalizedUrl && !normalizedUrl.startsWith("ws://") && !normalizedUrl.startsWith("wss://")) {
      normalizedUrl = `wss://${normalizedUrl}`;
    }
    // Store the URL *without* the ticket: tickets expire in about a minute, so a
    // reconnect has to fetch a fresh one rather than replay the stale one.
    this.url = normalizedUrl;
    void this.openSocket(normalizedUrl);
  }

  /**
   * Fetch a handshake ticket, then open the socket.
   *
   * The ticket request goes to the relative `/api` path, which the Next.js rewrite
   * proxies server-side — so it is first-party and the auth cookie applies. The
   * WebSocket itself connects straight to the backend, where that cookie would not
   * be sent if the two are on unrelated hosts (Vercel + Railway). The ticket carries
   * the identity across that gap.
   *
   * If the request fails we still try the bare URL: on a same-host deployment the
   * cookie reaches the handshake by itself, and the server accepts either.
   */
  private async openSocket(baseUrl: string) {
    let target = baseUrl;
    try {
      const res = await fetch("/api/auth/ws-ticket", { credentials: "include" });
      if (res.ok) {
        const body = await res.json();
        const ticket = body?.data?.ticket;
        if (ticket) {
          const sep = baseUrl.includes("?") ? "&" : "?";
          target = `${baseUrl}${sep}ticket=${encodeURIComponent(ticket)}`;
        }
      }
    } catch {
      // Offline or the backend is unreachable — fall through and let the socket
      // attempt (and its onclose retry) surface the problem.
    }

    // disconnect() may have been called while the ticket was in flight.
    if (this.intentionalClose) {
      this.connecting = false;
      return;
    }

    try {
      this.socket = new WebSocket(target);

      this.socket.onopen = () => {
        this.connecting = false;
        console.log("WebSocket connected to", baseUrl);
        this.emitInternal("connect", null);
        
        // Flush queue
        if (this.queue.length > 0) {
          console.log(`Flushing ${this.queue.length} queued WebSocket messages...`);
          this.queue.forEach((msg) => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
              this.socket.send(JSON.stringify(msg));
            }
          });
          this.queue = [];
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.event) {
            // The server rejects unauthenticated / bad-origin handshakes with this
            // event right before closing. Don't hammer it with reconnects — wait for
            // the next explicit connect() after the auth state changes.
            if (parsed.event === "unauthorized") {
              this.authFailed = true;
              console.warn("[WebSocket] not authorized — pausing reconnects until next sign-in.");
            }
            this.emitInternal(parsed.event, parsed.data);
          }
        } catch (err) {
          console.warn("WebSocket failed to parse message data", event.data);
        }
      };

      this.socket.onerror = () => {
        // Browser WebSocket "error" events expose no useful detail (they serialize to {}),
        // and the onclose handler drives reconnection. Log a quiet warning instead of
        // console.error so it doesn't surface as a Next.js error overlay.
        console.warn("[WebSocket] connection issue — will retry if needed.");
      };

      this.socket.onclose = () => {
        this.connecting = false;
        this.socket = null;
        this.emitInternal("disconnect", null);
        // Only auto-reconnect for unexpected drops — not on intentional disconnects
        // or auth rejections (which would otherwise loop forever).
        if (this.intentionalClose || this.authFailed) {
          return;
        }
        this.reconnectTimeout = setTimeout(() => this.connect(this.url), 5000);
      };
    } catch (err) {
      this.connecting = false;
      console.error("Failed to initialize WebSocket:", err);
    }
  }

  disconnect() {
    this.intentionalClose = true;
    this.connecting = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.queue = [];
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
      console.log("WebSocket is not connected yet. Queuing message:", { event, data });
      this.queue.push({ event, data });
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
