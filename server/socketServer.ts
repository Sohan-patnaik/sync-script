import { createServer } from "http";
import { Server, Socket } from "socket.io";

interface RoomState {
  code: string;
  language: string;
  userCount: number;
}

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      code: "",
      language: "javascript",
      userCount: 0,
    });
  }
  return rooms.get(roomId)!;
}


const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL ?? "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket: Socket) => {

  let currentRoomId: string | null = null;

  socket.on("join-room", (roomId: string) => {

    if (currentRoomId) {
      handleLeave(socket, currentRoomId);
    }

    currentRoomId = roomId;
    socket.join(roomId);

    const room = getOrCreateRoom(roomId);
    room.userCount += 1;

    io.to(roomId).emit("user-count", room.userCount);

    socket.emit("init-code", {
      code: room.code,
      language: room.language,
    });

    console.log(
      `[join]  room=${roomId}  users=${room.userCount}  socket=${socket.id}`,
    );
  });

  socket.on(
    "code-change",
    ({ roomId, code }: { roomId: string; code: string }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.code = code;

      socket.to(roomId).emit("code-update", code);
    },
  );

  socket.on(
    "language-change",
    ({ roomId, language }: { roomId: string; language: string }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.language = language;

      socket.to(roomId).emit("language-update", language);
    },
  );

  socket.on(
    "send-message",
    ({
      roomId,
      message,
    }: {
      roomId: string;
      message: { text: string; senderId: string; timestamp: number };
    }) => {
      console.log(`[chat]  room=${roomId}  text=${message.text}`);
      socket.to(roomId).emit("receive-message", message);
    },
  );


  socket.on("disconnect", () => {
    if (currentRoomId) {
      handleLeave(socket, currentRoomId);
    }
  });
});

function handleLeave(socket: Socket, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.userCount -= 1;

  console.log(
    `[leave] room=${roomId}  users=${room.userCount}  socket=${socket.id}`,
  );

  if (room.userCount <= 0) {
    rooms.delete(roomId);
    console.log(`[clean] room=${roomId} deleted`);
  } else {
    io.to(roomId).emit("user-count", room.userCount);
  }
}

const PORT = Number(process.env.PORT ?? 3001);

httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});