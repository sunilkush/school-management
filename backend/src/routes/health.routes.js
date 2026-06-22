import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

  res.json({
    success: true,
    data: {
      status: "ok",
      uptime: Math.floor(process.uptime()),
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
