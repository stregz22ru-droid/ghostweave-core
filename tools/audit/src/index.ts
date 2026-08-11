#!/usr/bin/env node

// GHOSTWEAVE SDK Audit v1.0
// Запуск всех тестов аудита

import { logger } from "./utils/logger";
import { runComplianceTests } from "./tests/sdk-01-compliance.test";
import { runCrossImplementationTests } from "./tests/sdk-02-cross.test";
import { runNegativeTests } from "./tests/sdk-03-negative.test";
import { runAPITests } from "./tests/sdk-04-api.test";
import { runLeakageTests } from "./tests/sdk-05-leakage.test";

// ============================================================================
// Constants
// ============================================================================

const VERSION = "1.0.0";
const AUDIT_DATE = new Date().toISOString();

// ============================================================================
// Results
// ============================================================================

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  errors: string[];
  duration: number;
}

const results: TestResult[] = [];

// ============================================================================
// Test Runner
// ============================================================================

async function runTest(
  id: string,
  name: string,
  fn: () => Promise<{ passed: boolean; errors: string[] }>
): Promise<void> {
  logger.blank();
  logger.info(`🧪 ${id}: ${name}`);
  logger.separator();

  const start = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - start;

    results.push({
      id,
      name,
      passed: result.passed,
      errors: result.errors,
      duration
    });

    if (result.passed) {
      logger.success(`✅ ${id} PASSED (${duration}ms)`);
    } else {
      logger.error(`❌ ${id} FAILED (${duration}ms)`);
      for (const err of result.errors) {
        logger.log("error", `   ${err}`);
      }
    }
  } catch (err) {
    const duration = Date.now() - start;
    results.push({
      id,
      name,
      passed: false,
      errors: [err instanceof Error ? err.message : String(err)],
      duration
    });
    logger.error(`❌ ${id} FAILED with exception (${duration}ms)`);
    logger.log("error", `   ${err}`);
  }

  logger.separator();
}

// ============================================================================
// Report
// ============================================================================

function generateReport(): string {
  const lines: string[] = [];

  lines.push("# GHOSTWEAVE SDK Audit Report");
  lines.push("");
  lines.push(`**Date:** ${AUDIT_DATE}`);
  lines.push(`**Version:** ${VERSION}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Test | Status | Duration |");
  lines.push("|------|--------|----------|");

  for (const r of results) {
    const status = r.passed ? "✅ PASSED" : "❌ FAILED";
    lines.push(`| ${r.id} | ${status} | ${r.duration}ms |`);
  }

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  lines.push("");
  lines.push(`**Total:** ${total} tests`);
  lines.push(`**Passed:** ${passed}`);
  lines.push(`**Failed:** ${failed}`);
  lines.push("");

  if (failed === 0) {
    lines.push("## ✅ ALL TESTS PASSED");
    lines.push("");
    lines.push("**SDK Audit: PASSED**");
    lines.push("");
    lines.push("SDK соответствует критериям Reference Implementation.");
  } else {
    lines.push("## ❌ SOME TESTS FAILED");
    lines.push("");
    lines.push("**SDK Audit: FAILED**");
    lines.push("");
    lines.push("Требуются исправления перед присвоением статуса Reference Implementation.");
    lines.push("");
    lines.push("### Failed Tests");
    lines.push("");
    for (const r of results) {
      if (!r.passed) {
        lines.push(`#### ${r.id}: ${r.name}`);
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
// Main
// ============================================================================

async function main(): Promise<void> {
  logger.blank();
  logger.info("🔍 GHOSTWEAVE SDK Audit v1.0");
  logger.info(`Date: ${AUDIT_DATE}`);
  logger.blank();
  logger.separator();

  // Run all tests
  await runTest("SDK-01", "Protocol Compliance", runComplianceTests);
  await runTest("SDK-02", "Cross Implementation", runCrossImplementationTests);
  await runTest("SDK-03", "Negative Tests", runNegativeTests);
  await runTest("SDK-04", "Public API Stability", runAPITests);
  await runTest("SDK-05", "Zero Protocol Leakage", runLeakageTests);

  // Generate report
  const report = generateReport();
  const fs = require("fs");
  const path = require("path");

  const reportDir = path.join(__dirname, "../reports");
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, "audit-report.md");
  fs.writeFileSync(reportPath, report, "utf-8");

  logger.blank();
  logger.success(`📄 Report saved to: ${reportPath}`);
  logger.blank();

  // Summary
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  logger.info(`📊 Summary: ${passed}/${total} tests passed`);

  if (failed === 0) {
    logger.blank();
    logger.success("✅ SDK Audit: PASSED");
    logger.info("SDK соответствует критериям Reference Implementation.");
  } else {
    logger.blank();
    logger.error("❌ SDK Audit: FAILED");
    logger.info("Требуются исправления.");
    process.exit(1);
  }

  logger.blank();
}

// ============================================================================
// Run
// ============================================================================

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

export default main;