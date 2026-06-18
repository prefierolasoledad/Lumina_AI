import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

// Map of userId → Set of WebSocket clients
const clients = new Map();

let wss: WebSocketServer | null = null;

// Minimal cookie header parser (avoids pulling in express middleware here)
function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function initWebSocketServer(server: HttpServer) {
  wss = new WebSocketServer({ server });

  wss.on('listening', () => {
    console.log(`WebSocket server initialized and sharing Express HTTP server port`);
  });

  wss.on('connection', (ws, req) => {
    // Reject cross-site WebSocket handshakes (CSWSH). Because auth cookies are
    // SameSite=None in production, a malicious page could open a socket in the
    // victim's browser and have their cookies attached. Validate the Origin header
    // against the configured frontend. Requests without an Origin (native clients,
    // not browsers) are allowed since CSWSH is a browser-only attack.
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
    ];
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      try {
        ws.send(JSON.stringify({ event: 'unauthorized', data: { message: 'Origin not allowed' } }));
      } catch {}
      ws.close();
      return;
    }

    // Authenticate the connection from the httpOnly accessToken cookie sent on the
    // upgrade request. The client-supplied userId is NOT trusted — we only ever use
    // the id derived from the verified JWT, preventing subscribing to other users' jobs.
    let authenticatedUserId: string | null = null;
    try {
      const cookies = parseCookies(req.headers.cookie);
      if (cookies.accessToken) {
        const decoded = jwt.verify(cookies.accessToken, process.env.JWT_SECRET as string) as any;
        authenticatedUserId = decoded?.userId ?? null;
      }
    } catch {
      authenticatedUserId = null;
    }

    if (!authenticatedUserId) {
      try {
        ws.send(JSON.stringify({ event: 'unauthorized', data: { message: 'Authentication required' } }));
      } catch {}
      ws.close();
      return;
    }

    // Client sends { event: 'subscribe' } on connect — userId is taken from the token.
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'subscribe') {
          if (!clients.has(authenticatedUserId)) {
            clients.set(authenticatedUserId, new Set());
          }
          clients.get(authenticatedUserId).add(ws);
          ws.send(JSON.stringify({ event: 'subscribed', data: { userId: authenticatedUserId } }));
        }
      } catch (e) {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      // Remove ws from all user sets
      clients.forEach((sockets) => sockets.delete(ws));
    });
  });

  wss.on('error', (err) => {
    console.error('WebSocket server error:', err);
  });

  return wss;
}

/**
 * Emit an event to all WebSocket clients subscribed to a given userId.
 */
export function emitToUser(userId, event, data) {
  const userSockets = clients.get(userId.toString());
  if (!userSockets) return;

  const payload = JSON.stringify({ event, data });
  userSockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}
