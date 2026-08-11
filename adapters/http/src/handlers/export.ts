// GHOSTWEAVE HTTP API: Export Handler v1.0
// Обработка запросов на экспорт цепочки

import { Request, Response } from "express";
import { ChainStorage } from "../utils/storage";
import { ApiResponse, ExportRequest } from "../types/index";
import { asyncHandler } from "../middleware/error";
import { logger } from "../middleware/logger";
import { replayToCanonical } from "@ghostweave/core-sdk";

export class ExportHandler {
  private storage: ChainStorage;

  constructor(storage: ChainStorage) {
    this.storage = storage;
  }

  /**
   * POST /export
   * Экспорт цепочки в JSON
   */
  exportChain = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.body as ExportRequest;
    const format = body.format || "json";

    if (this.storage.getLength() === 0) {
      res.status(400).json({
        success: false,
        error: "Chain is empty. Nothing to export.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const chain = this.storage.getChain();
      let exportData: string;
      let contentType: string;
      let fileName: string;

      if (format === "canonical") {
        // Используем canonical экспорт
        const { canonical } = replayToCanonical(chain, { verifyHashes: true });
        exportData = canonical;
        contentType = "application/json";
        fileName = `export_${Date.now()}_canonical.json`;
      } else {
        // Стандартный JSON экспорт
        const events = this.storage.getRange();
        exportData = JSON.stringify({
          version: "1.0.0",
          protocol: "GWP/1.0",
          profile: "ghostweave-profile-v1",
          exportedAt: new Date().toISOString(),
          eventCount: events.length,
          events: events
        }, null, 2);
        contentType = "application/json";
        fileName = `export_${Date.now()}.json`;
      }

      // Проверяем, хочет ли клиент скачать файл
      const download = req.query.download === "true";

      if (download) {
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.send(exportData);
        return;
      }

      // Иначе возвращаем JSON в теле ответа
      const response: ApiResponse<{
        format: string;
        data: unknown;
      }> = {
        success: true,
        data: {
          format,
          data: JSON.parse(exportData)
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (err) {
      logger.error(`Export failed: ${err}`);
      res.status(500).json({
        success: false,
        error: `Export failed: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /export/download
   * Скачивание экспортированной цепочки
   */
  downloadExport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const format = req.query.format as string || "json";

    if (this.storage.getLength() === 0) {
      res.status(400).json({
        success: false,
        error: "Chain is empty. Nothing to export.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const chain = this.storage.getChain();
      let exportData: string;
      let contentType: string;
      let fileName: string;

      if (format === "canonical") {
        const { canonical } = replayToCanonical(chain, { verifyHashes: true });
        exportData = canonical;
        contentType = "application/json";
        fileName = `export_${Date.now()}_canonical.json`;
      } else {
        const events = this.storage.getRange();
        exportData = JSON.stringify({
          version: "1.0.0",
          protocol: "GWP/1.0",
          profile: "ghostweave-profile-v1",
          exportedAt: new Date().toISOString(),
          eventCount: events.length,
          events: events
        }, null, 2);
        contentType = "application/json";
        fileName = `export_${Date.now()}.json`;
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.send(exportData);

    } catch (err) {
      logger.error(`Export download failed: ${err}`);
      res.status(500).json({
        success: false,
        error: `Export failed: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toISOString()
      });
    }
  });
}

export default ExportHandler;