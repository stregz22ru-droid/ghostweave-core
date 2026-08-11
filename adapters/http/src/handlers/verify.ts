// GHOSTWEAVE HTTP API: Verify Handler v1.0
// Обработка запросов на верификацию цепочки

import { Request, Response } from "express";
import { ChainStorage } from "../utils/storage";
import { ApiResponse, VerifyChainRequest } from "../types/index";
import { asyncHandler } from "../middleware/error";

export class VerifyHandler {
  private storage: ChainStorage;

  constructor(storage: ChainStorage) {
    this.storage = storage;
  }

  /**
   * POST /verify
   * Проверка целостности цепочки
   */
  verifyChain = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.body as VerifyChainRequest;

    if (this.storage.getLength() === 0) {
      res.status(400).json({
        success: false,
        error: "Chain is empty. Nothing to verify.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    const result = this.storage.verify({
      from: body.from,
      to: body.to,
      checkHashes: body.checkHashes ?? true,
      checkContinuity: body.checkContinuity ?? true,
      checkGenesis: body.checkGenesis ?? true
    });

    const response: ApiResponse<{
      status: string;
      errors: unknown[];
      warnings: string[];
      stats: {
        totalEvents: number;
        validHashes: number;
        invalidHashes: number;
        missingParents: number;
      };
    }> = {
      success: result.status === "VALID",
      data: {
        status: result.status,
        errors: result.errors,
        warnings: result.warnings,
        stats: result.stats
      },
      timestamp: new Date().toISOString()
    };

    const statusCode = result.status === "VALID" ? 200 : result.status === "PARTIAL" ? 206 : 422;
    res.status(statusCode).json(response);
  });

  /**
   * GET /verify/status
   * Краткий статус верификации
   */
  getVerifyStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    if (this.storage.getLength() === 0) {
      res.status(400).json({
        success: false,
        error: "Chain is empty.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    const result = this.storage.verify({
      checkHashes: true,
      checkContinuity: true,
      checkGenesis: true
    });

    const response: ApiResponse<{
      status: string;
      totalEvents: number;
      valid: boolean;
    }> = {
      success: true,
      data: {
        status: result.status,
        totalEvents: result.stats.totalEvents,
        valid: result.status === "VALID"
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });
}

export default VerifyHandler;