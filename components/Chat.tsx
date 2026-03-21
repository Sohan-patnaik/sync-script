"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
}

interface ChatProps {
  roomId: string;
  messages: Message[];
  myId: string;
  onSendMessage: (text: string) => void;
}

export default function Chat({ messages, myId, onSendMessage }: ChatProps) {
  const [draft, setDraft] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    onSendMessage(text);
    setDraft("");
  }, [draft, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      borderLeft: "1px solid #333", backgroundColor: "#1e1e1e",
      color: "#fff", width: "260px", flexShrink: 0,
    }}>
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid #333",
        fontSize: "13px", fontWeight: 500, color: "#aaa",
      }}>
        Chat
      </div>

      <div style={{
        flex: 1, overflowY: "auto", padding: "10px 14px",
        display: "flex", flexDirection: "column", gap: "10px",
      }}>
        {messages.length === 0 && (
          <span style={{ fontSize: "12px", color: "#555" }}>
            No messages yet
          </span>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderId === myId;
          return (
            <div key={msg.id} style={{
              alignSelf: isOwn ? "flex-end" : "flex-start",
              maxWidth: "85%",
            }}>
              <div style={{
                background: isOwn ? "#0e639c" : "#2d2d2d",
                borderRadius: isOwn ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding: "6px 10px", fontSize: "13px",
                lineHeight: 1.5, wordBreak: "break-word",
              }}>
                {msg.text}
              </div>
              <div style={{
                fontSize: "10px", color: "#555", marginTop: "2px",
                textAlign: isOwn ? "right" : "left",
              }}>
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit",
                })}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: "10px 14px", borderTop: "1px solid #333",
        display: "flex", gap: "8px",
      }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          style={{
            flex: 1, background: "#2d2d2d", border: "1px solid #555",
            borderRadius: "4px", padding: "6px 10px",
            color: "#fff", fontSize: "13px", outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!draft.trim()}
          style={{
            background: "#0e639c", color: "#fff", border: "none",
            borderRadius: "4px", padding: "6px 12px",
            cursor: draft.trim() ? "pointer" : "default",
            opacity: draft.trim() ? 1 : 0.4, fontSize: "13px",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}