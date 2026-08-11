// GHOSTWEAVE HTTP API: Events Handler v1.0
// Обработка запросов к событиям

import { Request, Response } from "express";
import { createEvent, type Event } from "@ghostweave/core-sdk";
import { ChainStorage } from "../utils/storage";
import { ApiResponse, AppendEventRequest } from "../types/index";
import { asyncHandler } from "../middleware/error";

export class EventsHandler {
  private storage: ChainStorage;

  constructor(storage: ChainStorage) {
    this.storage = storage;
  }

  /**
   * POST /events
   * Добавление нового события в цепочку
   */
  appendEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.body as AppendEventRequest;

    // Проверка обязательных полей
    if (!body.type) {
      res.status(400).json({
        success: false,
        error: "Missing required field: type",
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!body.source) {
      res.status(400).json({
        success: false,
        error: "Missing required field: source",
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Проверка наличия цепочки
    if (this.storage.getLength() === 0) {
      res.status(400).json({
        success: false,
        error: "Chain is empty. Please initialize with a genesis event first.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Получаем последний хеш для связи
    const lastEvent = this.storage.getLast();
    const previousHash = lastEvent ? lastEvent.hash : undefined;

    // Создаем событие
    let event: Event;
    try {
      event = createEvent({
        type: body.type,
        source: body.source,
        payload: body.payload || {},
        metadata: body.metadata,
        previousHash: body.previousHash || previousHash
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: `Failed to create event: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Добавляем в цепочку
    const result = this.storage.append(event);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || "Failed to append event",
        timestamp: new Date().toISOString()
      });
      return;
    }

    const response: ApiResponse<{ event: Event; chainLength: number }> = {
      success: true,
      data: {
        event,
        chainLength: this.storage.getLength()
      },
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  });

  /**
   * POST /events/genesis
   * Создание genesis события
   */
  createGenesis = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.body;

    // Проверка, что цепочка пуста
    if (this.storage.getLength() > 0) {
      res.status(400).json({
        success: false,
        error: "Chain already has events. Genesis can only be created on empty chain.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Создаем genesis событие
    const type = body.type || "genesis";
    const source = body.source || "http-adapter";
    const payload = body.payload || { message: "Chain initialized via HTTP API" };
    const metadata = body.metadata || { version: "1.0.0", initiator: "http-adapter" };

    let event: Event;
    try {
      event = createEvent({
        type,
        source,
        payload,
        metadata,
        previousHash: undefined
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: `Failed to create genesis event: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Добавляем в цепочку
    const result = this.storage.append(event);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || "Failed to append genesis event",
        timestamp: new Date().toISOString()
      });
      return;
    }

    const response: ApiResponse<{ event: Event; chainLength: number }> = {
      success: true,
      data: {
        event,
        chainLength: this.storage.getLength()
      },
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  });

  /**
   * POST /events/batch
   * Добавление нескольких событий в цепочку
   */
  batchAppend = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const events = req.body.events as AppendEventRequest[];

    if (!events || !Array.isArray(events) || events.length === 0) {
      res.status(400).json({
        success: false,
        error: "Missing or invalid 'events' array",
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Проверка наличия цепочки
    if (this.storage.getLength() === 0) {
      res.status(400).json({
        success: false,
        error: "Chain is empty. Please initialize with a genesis event first.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    const results: { success: boolean; event?: Event; error?: string }[] = [];
    let lastEvent = this.storage.getLast();
    let previousHash = lastEvent ? lastEvent.hash : undefined;

    for (const eventData of events) {
      try {
        const event = createEvent({
          type: eventData.type || "generic",
          source: eventData.source || "http-adapter",
          payload: eventData.payload || {},
          metadata: eventData.metadata,
          previousHash: eventData.previousHash || previousHash
        });

        const result = this.storage.append(event);
        results.push(result);
        if (result.success && result.event) {
          lastEvent = result.event;
          previousHash = lastEvent.hash;
        }
      } catch (err) {
        results.push({
          success: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    const response: ApiResponse<{
      results: typeof results;
      total: number;
      successful: number;
      failed: number;
      chainLength: number;
    }> = {
      success: true,
      data: {
        results,
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        chainLength: this.storage.getLength()
      },
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  });
}

export default EventsHandler;