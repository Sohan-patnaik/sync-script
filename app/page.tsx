"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/room", { method: "POST" });
      const { roomId } = await res.json();
      router.push(`/room/${roomId}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="text-center space-y-6 p-8 bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-lg border border-gray-700">
        
        <h1 className="text-4xl font-bold tracking-tight">
          🚀 SyncScript
        </h1>

        <p className="text-gray-300 text-lg">
          Real-time collaborative code editor with Chat feature
        </p>

        <button
          onClick={createRoom}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-all duration-200 rounded-xl font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create room"}
        </button>

      </div>
    </main>
  );
}