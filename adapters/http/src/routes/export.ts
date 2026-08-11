// GHOSTWEAVE HTTP API: Export Routes v1.0
// Маршруты для экспорта цепочки

import { Router } from "express";
import { ExportHandler } from "../handlers/export";

export function createExportRoutes(exportHandler: ExportHandler): Router {
  const router = Router();

  // POST /export — экспорт цепочки в JSON
  router.post("/", exportHandler.exportChain);

  // GET /export/download — скачивание экспортированной цепочки
  router.get("/download", exportHandler.downloadExport);

  return router;
}

export default createExportRoutes;