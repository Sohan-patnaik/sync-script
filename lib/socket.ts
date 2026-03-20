import { io, Socket } from "socket.io-client";

declare global {
  interface Window {
    _socket?: Socket;
  }
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;

export function getSocket(): Socket {

  if (typeof window === "undefined") {
    throw new Error(
      "getSocket() was called outside the browser. " +
      "Call it inside useEffect or a browser-only code path."
    );
  }

  if (window._socket && (window._socket.connected || window._socket.active)) {
    return window._socket;
  }


  if (window._socket) {
    window._socket.disconnect();
    window._socket = undefined;
  }

  const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"],
  });

  window._socket = socket;

  return socket;
}

export function destroySocket(): void {
  if (typeof window === "undefined") return;

  if (window._socket) {
    window._socket.disconnect();
    window._socket = undefined;
  }
}