// GHOSTWEAVE HTTP API: Routes Index v1.0
// Объединение всех маршрутов

import { Router } from "express";
import { ChainHandler } from "../handlers/chain";
import { EventsHandler } from "../handlers/events";
import { VerifyHandler } from "../handlers/verify";
import { ReplayHandler } from "../handlers/replay";
import { ExportHandler } from "../handlers/export";
import { ChainStorage } from "../utils/storage";

export function createRoutes(storage: ChainStorage): Router {
  const router = Router();

  // Создаем обработчики
  const chainHandler = new ChainHandler(storage);
  const eventsHandler = new EventsHandler(storage);
  const verifyHandler = new VerifyHandler(storage);
  const replayHandler = new ReplayHandler(storage);
  const exportHandler = new ExportHandler(storage);

  // ==========================================================================
  // Chain routes
  // ==========================================================================

  router.get("/chain/status", chainHandler.getStatus);
  router.get("/chain/events", chainHandler.getEvents);
  router.get("/chain/events/:id", chainHandler.getEventById);
  router.delete("/chain/clear", chainHandler.clearChain);
  router.get("/chain/health", chainHandler.getHealth);

  // ==========================================================================
  // Events routes
  // ==========================================================================

  router.post("/events", eventsHandler.appendEvent);
  router.post("/events/genesis", eventsHandler.createGenesis);
  router.post("/events/batch", eventsHandler.batchAppend);

  // ==========================================================================
  // Verify routes
  // ==========================================================================

  router.post("/verify", verifyHandler.verifyChain);
  router.get("/verify/status", verifyHandler.getVerifyStatus);

  // ==========================================================================
  // Replay routes
  // ==========================================================================

  router.post("/replay", replayHandler.replayChain);
  router.get("/replay/evidence", replayHandler.getEvidenceSummary);

  // ==========================================================================
  // Export routes
  // ==========================================================================

  router.post("/export", exportHandler.exportChain);
  router.get("/export/download", exportHandler.downloadExport);

  // ==========================================================================
  // Health check
  // ==========================================================================

  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      protocol: "GWP/1.0",
      profile: "ghostweave-profile-v1"
    });
  });

  return router;
}

export default createRoutes;