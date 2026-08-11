// GHOSTWEAVE HTTP API: Verify Routes v1.0
// Маршруты для верификации цепочки

import { Router } from "express";
import { VerifyHandler } from "../handlers/verify";

export function createVerifyRoutes(verifyHandler: VerifyHandler): Router {
  const router = Router();

  // POST /verify — полная верификация цепочки
  router.post("/", verifyHandler.verifyChain);

  // GET /verify/status — краткий статус верификации
  router.get("/status", verifyHandler.getVerifyStatus);

  return router;
}

export default createVerifyRoutes;