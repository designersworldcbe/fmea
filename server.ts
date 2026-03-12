import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import app from "./src/server/app";
import { initDB } from "./src/server/db";

async function startServer() {
  const PORT = 3000;

  // Initialize Neon Database
  await initDB();

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!process.env.DATABASE_URL) {
      console.log(`\n⚠️  WARNING: DATABASE_URL is not set. API endpoints will return an error.`);
      console.log(`Please set DATABASE_URL in your environment or .env file to connect to Neon Database.\n`);
    }
  });
}

startServer();
