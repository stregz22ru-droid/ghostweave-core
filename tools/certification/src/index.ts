#!/usr/bin/env node

// GHOSTWEAVE Certification Kit v1.0
// Генерация валидной цепочки и её проверка

import * as fs from "fs";
import * as path from "path";
import {
  createChain,
  appendToChain,
  verifyChain,
  createEvent,
  createGenesisEvent,
  getLastEvent
} from "@ghostweave/core-sdk";

// ============================================================================
// Constants
// ============================================================================

const REPORTS_DIR = path.join(__dirname, "../reports");

interface SuiteResult {
  name: string;
  passed: boolean;
  errors: string[];
  details: Record<string, unknown>;
}

const results: SuiteResult[] = [];

// ============================================================================
// Helpers
// ============================================================================

function log(message: string, data?: unknown): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSuccess(message: string): void {
  console.log(`✅ ${message}`);
}

function logError(message: string): void {
  console.log(`❌ ${message}`);
}

function ensureReportDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function generateReport(): string {
  const lines: string[] = [];

  lines.push("# GHOSTWEAVE Certification Report");
  lines.push("");
  lines.push(`**Date:** ${new Date().toISOString()}`);
  lines.push(`**Version:** 1.0.0`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Suite | Status | Errors |");
  lines.push("|-------|--------|--------|");

  for (const r of results) {
    const status = r.passed ? "✅ PASSED" : "❌ FAILED";
    lines.push(`| ${r.name} | ${status} | ${r.errors.length} |`);
  }

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  lines.push("");
  lines.push(`**Total:** ${total}`);
  lines.push(`**Passed:** ${passed}`);
  lines.push(`**Failed:** ${failed}`);
  lines.push("");

  if (failed === 0) {
    lines.push("## ✅ ALL SUITES PASSED");
    lines.push("");
    lines.push("**Certification Kit: PASSED**");
  } else {
    lines.push("## ❌ SOME SUITES FAILED");
    lines.push("");
    for (const r of results) {
      if (!r.passed) {
        lines.push(`### ${r.name}`);
        lines.push("");
        for (const err of r.errors) {
          lines.push(`- ${err}`);
        }
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

// ============================================================================
// Canonical Suite (generated)
// ============================================================================

function runCanonicalSuite(): SuiteResult {
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  log("Running Canonical Suite (generated)...");

  try {
    const chain = createChain({ name: "certification-chain" });

    // Генерируем Genesis
    const genesis = createGenesisEvent(
      "cert.genesis",
      "certification-kit",
      { message: "Certification Kit Genesis" },
      { version: "1.0.0", certification: true }
    );
    const result1 = appendToChain(chain, genesis);
    if (!result1.success) {
      errors.push(`Failed to append genesis: ${result1.error}`);
      logError(`Failed to append genesis: ${result1.error}`);
    } else {
      logSuccess("Genesis created and appended");
    }

    // Генерируем 10 событий, передавая previousHash
    let appendedCount = 0;
    for (let i = 0; i < 10; i++) {
      const lastEvent = getLastEvent(chain);
      const previousHash = lastEvent ? lastEvent.hash : undefined;

      const event = createEvent({
        type: "cert.test",
        source: "certification-kit",
        payload: {
          index: i + 1,
          message: `Test event #${i + 1}`,
          data: "Certification Kit validation"
        },
        metadata: {
          suite: "canonical",
          test: true
        },
        previousHash: previousHash
      });

      const result = appendToChain(chain, event);
      if (!result.success) {
        errors.push(`Failed to append event ${i + 1}: ${result.error}`);
        logError(`Failed to append event ${i + 1}: ${result.error}`);
      } else {
        appendedCount++;
        logSuccess(`Event ${i + 1} appended (hash: ${event.hash.slice(0, 16)}...)`);
      }
    }

    details["totalEvents"] = chain.events.length;
    details["appendedCount"] = appendedCount;
    logSuccess(`Chain built with ${chain.events.length} events (${appendedCount} new)`);

    // Верификация
    const verifyResult = verifyChain(chain);
    if (verifyResult.status === "VALID") {
      logSuccess(`Verification: ${verifyResult.status}`);
      details["verificationStatus"] = verifyResult.status;
    } else {
      errors.push(`Verification failed: ${verifyResult.status}`);
      logError(`Verification: ${verifyResult.status}`);
    }

  } catch (err) {
    errors.push(`Suite execution failed: ${err}`);
    logError(`Suite execution failed: ${err}`);
  }

  const passed = errors.length === 0;
  if (passed) {
    logSuccess("Canonical Suite passed");
  } else {
    logError(`Canonical Suite failed with ${errors.length} errors`);
  }

  return {
    name: "Canonical Suite",
    passed,
    errors,
    details
  };
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  log("🚀 GHOSTWEAVE Certification Kit v1.0");

  ensureReportDir();

  results.push(runCanonicalSuite());

  const report = generateReport();
  const reportPath = path.join(REPORTS_DIR, "certification-report.md");
  fs.writeFileSync(reportPath, report, "utf-8");

  log(`📄 Report saved to: ${reportPath}`);

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  log(`📊 Summary: ${passed}/${total} suites passed`);

  if (failed === 0) {
    logSuccess("✅ Certification Kit: PASSED");
  } else {
    logError("❌ Certification Kit: FAILED");
    process.exit(1);
  }
}

main();