// GHOSTWEAVE HTTP API: Replay Handler v1.0
// Обработка запросов на восстановление доказательной цепочки

import { Request, Response } from "express";
import { ChainStorage } from "../utils/storage";
import { ApiResponse, ReplayRequest } from "../types/index";
import { asyncHandler } from "../middleware/error";

export class ReplayHandler {
  private storage: ChainStorage;

  constructor(storage: ChainStorage) {
    this.storage = storage;
  }

  /**
   * POST /replay
   * Восстановление доказательной цепочки
   */
  replayChain = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.body as ReplayRequest;

    if (this.storage.getLength() === 0) {
      res.status(400).json({
        success: false,
        error: "Chain is empty. Nothing to replay.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    const result = this.storage.replay({
      from: body.from,
      to: body.to,
      verifyHashes: body.verifyHashes ?? true,
      skipInvalid: body.skipInvalid ?? false
    });

    const response: ApiResponse<{
      status: string;
      verifiedChain: unknown[];
      verificationReport: {
        totalEvents: number;
        verified: number;
        invalid: number;
        missing: number;
      };
      missingEvents: string[];
      brokenLinks: {
        index: number;
        expected: string;
        actual: string;
      }[];
      warnings: string[];
    }> = {
      success: result.status === "VALID",
      data: {
        status: result.status,
        verifiedChain: result.verifiedChain,
        verificationReport: result.verificationReport,
        missingEvents: result.missingEvents,
        brokenLinks: result.brokenLinks,
        warnings: result.warnings
      },
      timestamp: new Date().toISOString()
    };

    const statusCode = result.status === "VALID" ? 200 : result.status === "PARTIAL" ? 206 : 422;
    res.status(statusCode).json(response);
  });

  /**
   * GET /replay/evidence
   * Получение сокращенной версии доказательной цепочки
   */
  getEvidenceSummary = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    if (this.storage.getLength() === 0) {
      res.status(400).json({
        success: false,
        error: "Chain is empty.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    const result = this.storage.replay({
      verifyHashes: true,
      skipInvalid: false
    });

    const evidence = result.verifiedChain.map(event => ({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      source: event.source,
      hash: event.hash.slice(0, 16) + "..."
    }));

    const response: ApiResponse<{
      status: string;
      count: number;
      evidence: typeof evidence;
    }> = {
      success: result.status === "VALID",
      data: {
        status: result.status,
        count: evidence.length,
        evidence
      },
      timestamp: new Date().toISOString()
    };

    const statusCode = result.status === "VALID" ? 200 : result.status === "PARTIAL" ? 206 : 422;
    res.status(statusCode).json(response);
  });
}

export default ReplayHandler;