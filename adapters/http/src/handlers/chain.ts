// GHOSTWEAVE HTTP API: Chain Handler v1.0
// Обработка запросов к цепочке

import { Request, Response } from "express";
import { ChainStorage } from "../utils/storage";
import { ApiResponse, ChainStatusResponse } from "../types/index";
import { asyncHandler } from "../middleware/error";

export class ChainHandler {
  private storage: ChainStorage;

  constructor(storage: ChainStorage) {
    this.storage = storage;
  }

  /**
   * GET /chain/status
   * Получение статуса цепочки
   */
  getStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const length = this.storage.getLength();
    const lastEvent = this.storage.getLast();
    const chain = this.storage.getChain();

    const response: ApiResponse<ChainStatusResponse> = {
      success: true,
      data: {
        length,
        lastEvent: lastEvent || undefined,
        genesisId: chain.events.length > 0 ? chain.events[0].id : undefined,
        lastHash: lastEvent ? lastEvent.hash : undefined
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  /**
   * GET /chain/events
   * Получение всех событий цепочки
   */
  getEvents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const events = this.storage.getRange(from, to);

    const response: ApiResponse<unknown> = {
      success: true,
      data: {
        events,
        count: events.length,
        total: this.storage.getLength()
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  /**
   * GET /chain/events/:id
   * Получение события по ID
   */
  getEventById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const event = this.storage.getEvent(id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: `Event with ID ${id} not found`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const response: ApiResponse<unknown> = {
      success: true,
      data: event,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  /**
   * DELETE /chain/clear
   * Очистка цепочки
   */
  clearChain = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const confirm = req.query.confirm === "true";

    if (!confirm) {
      res.status(400).json({
        success: false,
        error: "Confirmation required. Use ?confirm=true",
        timestamp: new Date().toISOString()
      });
      return;
    }

    this.storage.clear();

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Chain cleared successfully" },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  /**
   * GET /chain/health
   * Проверка состояния сервиса
   */
  getHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const length = this.storage.getLength();

    const response: ApiResponse<{
      status: string;
      eventCount: number;
      storagePath: string;
    }> = {
      success: true,
      data: {
        status: "healthy",
        eventCount: length,
        storagePath: this.storage.getFilePath()
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });
}

export default ChainHandler;