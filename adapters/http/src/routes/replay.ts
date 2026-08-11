// GHOSTWEAVE HTTP API: Replay Routes v1.0
// Маршруты для восстановления доказательной цепочки

import { Router } from "express";
import { ReplayHandler } from "../handlers/replay";

export function createReplayRoutes(replayHandler: ReplayHandler): Router {
  const router = Router();

  // POST /replay — восстановление доказательной цепочки
  router.post("/", replayHandler.replayChain);

  // GET /replay/evidence — сокращенная версия доказательной цепочки
  router.get("/evidence", replayHandler.getEvidenceSummary);

  return router;
}

export default createReplayRoutes;