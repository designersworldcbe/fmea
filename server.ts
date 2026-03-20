import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createApp, setIO } from "./src/server/app";
import { initDB } from "./src/server/db";

async function startServer() {
  const PORT = 3000;

  // Initialize Neon Database
  await initDB();

  const httpServer = createServer();
  const io = new Server(httpServer);
  setIO(io);
  const app = createApp(io);
  httpServer.on("request", app);

  const connectedUsers = new Map<string, { id: string; name: string }>();

  io.on("connection", (socket) => {
    console.log("a user connected", socket.id);
    
    // For now, assume a default name
    connectedUsers.set(socket.id, { id: socket.id, name: `User ${socket.id.slice(0, 4)}` });
    io.emit("users:update", Array.from(connectedUsers.values()));

    socket.on("disconnect", () => {
      console.log("user disconnected", socket.id);
      connectedUsers.delete(socket.id);
      io.emit("users:update", Array.from(connectedUsers.values()));
    });
    socket.on("comment:added", (comment) => {
      io.emit("comment:added", comment);
    });

    socket.on("assignment:added", (assignment) => {
      io.emit("assignment:added", assignment);
    });
    
    // Add socket logic here
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!process.env.DATABASE_URL) {
      console.log(`\n⚠️  WARNING: DATABASE_URL is not set. API endpoints will return an error.`);
      console.log(`Please set DATABASE_URL in your environment or .env file to connect to Neon Database.\n`);
    }
  });
}

startServer();
