// GHOSTWEAVE HTTP API: Type Definitions v1.0
// Типы для HTTP Adapter

import type { Event } from "@ghostweave/core-sdk";

// ============================================================================
// Request Types
// ============================================================================

export interface AppendEventRequest {
  type: string;
  source: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
  previousHash?: string;
}

export interface VerifyChainRequest {
  from?: string;
  to?: string;
  checkHashes?: boolean;
  checkContinuity?: boolean;
  checkGenesis?: boolean;
  checkProfile?: boolean;
}

export interface ReplayRequest {
  from?: string;
  to?: string;
  verifyHashes?: boolean;
  skipInvalid?: boolean;
}

export interface ExportRequest {
  format?: "json" | "canonical";
  includeMetadata?: boolean;
}

// ============================================================================
// Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ChainStatusResponse {
  length: number;
  lastEvent?: Event;
  genesisId?: string;
  lastHash?: string;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "offline";
  version: string;
  protocol: string;
  profile: string;
  timestamp: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const ErrorCodes = {
  INVALID_REQUEST: "INVALID_REQUEST",
  CHAIN_NOT_FOUND: "CHAIN_NOT_FOUND",
  EVENT_NOT_FOUND: "EVENT_NOT_FOUND",
  VERIFICATION_FAILED: "VERIFICATION_FAILED",
  REPLAY_FAILED: "REPLAY_FAILED",
  EXPORT_FAILED: "EXPORT_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR"
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

// ============================================================================
// Config Types
// ============================================================================

export interface HttpConfig {
  port: number;
  host: string;
  dataDir: string;
  cors: {
    enabled: boolean;
    origins?: string[];
  };
  auth: {
    enabled: boolean;
    token?: string;
  };
  logging: {
    enabled: boolean;
    level: "debug" | "info" | "warn" | "error";
  };
}