"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import { getSocket, destroySocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";
import Chat from "@/components/Chat";

interface EditorProps {
  roomId: string;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
}

const SUPPORTED_LANGUAGES = [
  "javascript", "typescript", "python", "java", "cpp",
  "go", "rust", "html", "css", "json",
] as const;

function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  ) as T;
}

export default function Editor({ roomId }: EditorProps) {
  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("javascript");
  const [userCount, setUserCount] = useState<number>(1);
  const [connected, setConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myId, setMyId] = useState<string>("");

  const isRemoteUpdate = useRef<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  const emitCodeChange = useDebounce((newCode: string) => {
    socketRef.current?.emit("code-change", { roomId, code: newCode });
  }, 50);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleBeforeUnload = () => destroySocket();
    window.addEventListener("beforeunload", handleBeforeUnload);

    const handleConnect = () => {
      setConnected(true);
      setMyId(socket.id ?? "");
      socket.emit("join-room", roomId);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleInitCode = ({
      code: initialCode,
      language: initialLang,
    }: {
      code: string;
      language: string;
    }) => {
      isRemoteUpdate.current = true;
      setCode(initialCode);
      setLanguage(initialLang);
    };

    const handleCodeUpdate = (newCode: string) => {
      isRemoteUpdate.current = true;
      setCode(newCode);
    };

    const handleLanguageUpdate = (newLang: string) => {
      setLanguage(newLang);
    };

    const handleUserCount = (count: number) => {
      setUserCount(count);
    };

    const handleReceiveMessage = (message: Omit<ChatMessage, "id">) => {
      setMessages((prev) => [
        ...prev,
        { ...message, id: crypto.randomUUID() },
      ]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("init-code", handleInitCode);
    socket.on("code-update", handleCodeUpdate);
    socket.on("language-update", handleLanguageUpdate);
    socket.on("user-count", handleUserCount);
    socket.on("receive-message", handleReceiveMessage);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("init-code", handleInitCode);
      socket.off("code-update", handleCodeUpdate);
      socket.off("language-update", handleLanguageUpdate);
      socket.off("user-count", handleUserCount);
      socket.off("receive-message", handleReceiveMessage); 
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomId]);

  const sendMessage = useCallback((text: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    const message: Omit<ChatMessage, "id"> = {
      text,
      senderId: socket.id ?? "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, { ...message, id: crypto.randomUUID() }]);
    socket.emit("send-message", { roomId, message });
  }, [roomId]);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newCode = value ?? "";
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
      }
      setCode(newCode);
      emitCodeChange(newCode);
    },
    [emitCodeChange],
  );

  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newLang = e.target.value;
      setLanguage(newLang);
      socketRef.current?.emit("language-change", { roomId, language: newLang });
    },
    [roomId],
  );

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "8px 16px", borderBottom: "1px solid #333",
        backgroundColor: "#1e1e1e", color: "#fff",
      }}>
        <span style={{ fontWeight: 500 }}>Codeshare</span>

        <select value={language} onChange={handleLanguageChange} style={{
          background: "#2d2d2d", color: "#fff", border: "1px solid #555",
          borderRadius: "4px", padding: "4px 8px", cursor: "pointer",
        }}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <button onClick={handleCopyLink} style={{
          background: "#2d2d2d", color: "#fff", border: "1px solid #555",
          borderRadius: "4px", padding: "4px 12px", cursor: "pointer",
        }}>
          Copy link
        </button>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: "13px", color: "#aaa" }}>
          {userCount} {userCount === 1 ? "user" : "users"} online
        </span>

        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          backgroundColor: connected ? "#4caf50" : "#f44336",
          display: "inline-block",
        }} />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <MonacoEditor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            automaticLayout: true,
          }}
        />
        <Chat
          roomId={roomId}
          messages={messages}
          myId={myId}
          onSendMessage={sendMessage}
        />
      </div>
    </div>
  );
}