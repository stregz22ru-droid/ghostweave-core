// GHOSTWEAVE HTTP API: Events Routes v1.0
// Маршруты для работы с событиями

import { Router } from "express";
import { EventsHandler } from "../handlers/events";

export function createEventsRoutes(eventsHandler: EventsHandler): Router {
  const router = Router();

  // POST /events — добавление события
  router.post("/", eventsHandler.appendEvent);

  // POST /events/genesis — создание genesis события
  router.post("/genesis", eventsHandler.createGenesis);

  // POST /events/batch — массовое добавление событий
  router.post("/batch", eventsHandler.batchAppend);

  return router;
}

export default createEventsRoutes;