import { io, Socket } from "socket.io-client";
import { getTokens } from "@/shared/lib/tokens";
import { USE_MOCK } from "@/shared/lib/api";

export type SocketConnectionState = "OFFLINE" | "CONNECTING" | "ONLINE";

type EventHandler = (payload: any) => void;

let socket: Socket | null = null;
let connectionState: SocketConnectionState = "OFFLINE";
let connectionError: string | null = null;
const stateSubscribers = new Set<() => void>();
const eventSubscribers = new Map<string, Set<EventHandler>>();

function notifyState(): void {
  stateSubscribers.forEach((fn) => fn());
}

export function getSocketConnectionState(): SocketConnectionState {
  return connectionState;
}

export function getSocketConnectionError(): string | null {
  return connectionError;
}

export function subscribeSocketState(listener: () => void): () => void {
  stateSubscribers.add(listener);
  return () => stateSubscribers.delete(listener);
}

export function subscribeSimulatorEvent(event: string, handler: EventHandler): () => void {
  let handlers = eventSubscribers.get(event);
  if (!handlers) {
    handlers = new Set();
    eventSubscribers.set(event, handlers);
  }
  handlers.add(handler);

  if (socket) {
    socket.on(event, handler);
  }

  if (!USE_MOCK && !socket) {
    ensureSocketConnected();
  }

  return () => {
    handlers?.delete(handler);
    if (socket) {
      socket.off(event, handler);
    }
  };
}

export function ensureSocketConnected(): void {
  if (USE_MOCK) {
    connectionState = "OFFLINE";
    return;
  }

  const token = getTokens()?.accessToken;
  if (!token) {
    disconnectSocket();
    return;
  }

  if (socket) return;

  connectionState = "CONNECTING";
  connectionError = null;
  notifyState();

  const baseUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000/simulator";
  socket = io(baseUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    connectionState = "ONLINE";
    connectionError = null;
    notifyState();
  });

  socket.on("disconnect", () => {
    connectionState = "OFFLINE";
    notifyState();
  });

  socket.on("connect_error", (err) => {
    connectionState = "OFFLINE";
    connectionError = err.message || "Connection failed";
    notifyState();
  });

  eventSubscribers.forEach((handlers, event) => {
    handlers.forEach((h) => {
      socket?.on(event, h);
    });
  });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  connectionState = "OFFLINE";
  notifyState();
}
