// GHOSTWEAVE HTTP API: Chain Routes v1.0
// Маршруты для работы с цепочкой

import { Router } from "express";
import { ChainHandler } from "../handlers/chain";

export function createChainRoutes(chainHandler: ChainHandler): Router {
  const router = Router();

  // GET /chain/status — статус цепочки
  router.get("/status", chainHandler.getStatus);

  // GET /chain/events — все события
  router.get("/events", chainHandler.getEvents);

  // GET /chain/events/:id — событие по ID
  router.get("/events/:id", chainHandler.getEventById);

  // DELETE /chain/clear — очистка цепочки
  router.delete("/clear", chainHandler.clearChain);

  // GET /chain/health — проверка здоровья
  router.get("/health", chainHandler.getHealth);

  return router;
}

export default createChainRoutes;