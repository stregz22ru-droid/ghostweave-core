// GHOSTWEAVE HTTP API: Error Middleware v1.0
// Обработка ошибок и отправка структурированных ответов

import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/index";
import { logger } from "./logger";

/**
 * Стандартный формат ошибки
 */
export function createErrorResponse(
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };
}

/**
 * Обработчик ошибок для Express
 */
export function errorHandler(
  err: Error & { details?: Record<string, unknown> },
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`[${req.method}] ${req.url} — ${err.message}`);

  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = err.message || "Internal server error";
  let details: Record<string, unknown> | undefined;

  // Определяем статус код на основе типа ошибки
  if (err.message.includes("not found") || err.message.includes("not exist")) {
    statusCode = 404;
  } else if (err.message.includes("invalid") || err.message.includes("validation")) {
    statusCode = 400;
  } else if (err.message.includes("verification")) {
    statusCode = 422;
  } else if (err.message.includes("replay")) {
    statusCode = 422;
  } else if (err.message.includes("export")) {
    statusCode = 500;
  }

  if (err.details) {
    details = err.details;
  }

  const response = createErrorResponse(message, details);
  res.status(statusCode).json(response);
}

/**
 * Обработчик 404 ошибок
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn(`404: ${req.method} ${req.url}`);

  const response = createErrorResponse(
    `Route not found: ${req.method} ${req.url}`
  );

  res.status(404).json(response);
}

/**
 * Обработчик асинхронных ошибок (wrapper)
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createErrorResponse
};