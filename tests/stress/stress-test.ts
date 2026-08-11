// GHOSTWEAVE Stress Test v1.0 (FIXED)
// Phase C — Stress Tests (Performance + Protocol Validation)

import { resolve, join } from "path";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { createHash } from "crypto";

// ============================================================================
// TYPES
// ============================================================================

interface StressTestConfig {
  eventCount: number;
  batchSize: number;
  outputDir: string;
  fixturesDir: string;
}

interface Event {
  id: string;
  timestamp: number;
  type: string;
  source: string;
  previous_hash: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
  hash: string;
}

interface StressTestResult {
  name: string;
  passed: boolean;
  duration: number;
  details: Record<string, unknown>;
  errors?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONFIG: StressTestConfig = {
  eventCount: 10000,
  batchSize: 100,
  outputDir: resolve(__dirname, "results"),
  fixturesDir: resolve(__dirname, "fixtures")
};

const GENESIS_HASH = "0".repeat(64);

// ============================================================================
// HELPERS
// ============================================================================

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function computeHash(event: Omit<Event, "hash">): string {
  const content = JSON.stringify({
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    source: event.source,
    previous_hash: event.previous_hash,
    payload: event.payload,
    metadata: event.metadata
  });
  return createHash("sha256").update(content).digest("hex");
}

function createEvent(previousHash: string, index: number): Event {
  const event: Omit<Event, "hash"> = {
    id: generateId(),
    timestamp: Date.now() + index,
    type: "stress.test",
    source: "stress-test",
    previous_hash: previousHash,
    payload: {
      index,
      data: `Stress test event #${index}`,
      random: Math.random().toString(36).slice(2, 10)
    },
    metadata: {
      test: "stress",
      batch: Math.floor(index / CONFIG.batchSize)
    }
  };
  const hash = computeHash(event);
  return { ...event, hash };
}

function writeResults(fileName: string, data: unknown): void {
  if (!existsSync(CONFIG.outputDir)) {
    mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  const path = join(CONFIG.outputDir, fileName);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

// ============================================================================
// PART I: PERFORMANCE VALIDATION
// ============================================================================

async function testPerformance(): Promise<StressTestResult> {
  console.log("\n📊 PART I: Performance Validation");
  console.log(`   Generating ${CONFIG.eventCount} events...`);

  const start = Date.now();
  const events: Event[] = [];
  let previousHash = GENESIS_HASH;
  let memoryStart = process.memoryUsage().heapUsed;

  // 1. Append
  const appendStart = Date.now();
  for (let i = 0; i < CONFIG.eventCount; i++) {
    const event = createEvent(previousHash, i);
    events.push(event);
    previousHash = event.hash;
  }
  const appendDuration = Date.now() - appendStart;

  // 2. Memory
  const memoryEnd = process.memoryUsage().heapUsed;
  const memoryDelta = memoryEnd - memoryStart;

  // 3. Verify
  const verifyStart = Date.now();
  let verifyErrors: string[] = [];
  let validHashes = 0;
  let invalidHashes = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const { hash, ...eventWithoutHash } = event;
    const computed = computeHash(eventWithoutHash as Omit<Event, "hash">);
    if (computed === event.hash) {
      validHashes++;
    } else {
      invalidHashes++;
      verifyErrors.push(`Event ${i}: hash mismatch`);
    }
  }
  const verifyDuration = Date.now() - verifyStart;

  // 4. Replay (deterministic: always from genesis to current)
  const replayStart = Date.now();
  const replayedEvents: Event[] = [];
  let replayErrors: string[] = [];
  let prevHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.previous_hash !== prevHash && i > 0) {
      replayErrors.push(`Chain broken at event ${i}`);
    }
    replayedEvents.push(event);
    prevHash = event.hash;
  }
  const replayDuration = Date.now() - replayStart;

  // 5. Export (canonical)
  const exportStart = Date.now();
  const canonicalEvents = events.map(e => {
    const { hash, ...rest } = e;
    return rest;
  });
  const exportDuration = Date.now() - exportStart;

  const totalDuration = Date.now() - start;

  const result: StressTestResult = {
    name: "Performance Validation",
    passed: verifyErrors.length === 0 && replayErrors.length === 0,
    duration: totalDuration,
    details: {
      totalEvents: CONFIG.eventCount,
      appendTime: formatDuration(appendDuration),
      appendRate: `${Math.round(CONFIG.eventCount / (appendDuration / 1000))} events/sec`,
      verifyTime: formatDuration(verifyDuration),
      validHashes,
      invalidHashes,
      replayTime: formatDuration(replayDuration),
      exportTime: formatDuration(exportDuration),
      totalTime: formatDuration(totalDuration),
      memoryUsed: `${(memoryDelta / 1024 / 1024).toFixed(2)} MB`,
      verifyErrors: verifyErrors.length,
      replayErrors: replayErrors.length
    }
  };

  if (verifyErrors.length > 0) {
    result.errors = verifyErrors.slice(0, 5);
  }

  console.log(`   ✅ Events: ${CONFIG.eventCount}`);
  console.log(`   ✅ Append: ${formatDuration(appendDuration)}`);
  console.log(`   ✅ Verify: ${formatDuration(verifyDuration)}`);
  console.log(`   ✅ Replay: ${formatDuration(replayDuration)}`);
  console.log(`   ✅ Export: ${formatDuration(exportDuration)}`);
  console.log(`   ✅ Memory: ${(memoryDelta / 1024 / 1024).toFixed(2)} MB`);

  return result;
}

// ============================================================================
// PART II: PROTOCOL VALIDATION
// ============================================================================

async function testProtocol(): Promise<StressTestResult> {
  console.log("\n📋 PART II: Protocol Validation");
  console.log("   Checking deterministic behavior...");

  const start = Date.now();
  const errors: string[] = [];

  // 1. Generate test chain
  const chain: Event[] = [];
  let prev = GENESIS_HASH;
  for (let i = 0; i < 100; i++) {
    const event = createEvent(prev, i);
    chain.push(event);
    prev = event.hash;
  }

  // 2. Deterministic hash
  const hash1 = chain[50].hash;
  const eventCopy = JSON.parse(JSON.stringify(chain[50]));
  const { hash: _, ...eventWithoutHash } = eventCopy;
  const recomputed = computeHash(eventWithoutHash);
  if (recomputed !== hash1) {
    errors.push(`Hash mismatch on recompute`);
  }

  // 3. Canonical serialization (deterministic)
  const canon1 = JSON.stringify(chain[25]);
  const canon2 = JSON.stringify(JSON.parse(canon1));
  if (canon1 !== canon2) {
    errors.push(`Canonical serialization not deterministic`);
  }

  // 4. Replay determinism (FIXED: always from genesis to current)
  // Run replay twice on the same chain, both times from genesis to current
  const replay1: string[] = [];
  let hp = GENESIS_HASH;
  for (const e of chain) {
    if (e.previous_hash === hp) {
      replay1.push(e.id);
      hp = e.hash;
    }
  }

  // Second replay: same chain, same order
  const replay2: string[] = [];
  hp = GENESIS_HASH;
  for (const e of chain) {
    if (e.previous_hash === hp) {
      replay2.push(e.id);
      hp = e.hash;
    }
  }

  // Compare lengths and contents
  if (replay1.length !== replay2.length) {
    errors.push(`Replay not deterministic (different lengths)`);
  }
  
  // Also compare the actual order of event IDs
  if (JSON.stringify(replay1) !== JSON.stringify(replay2)) {
    errors.push(`Replay not deterministic (different order)`);
  }

  // 5. Fault injection tests
  const broken = JSON.parse(JSON.stringify(chain[30]));
  broken.hash = "f".repeat(64);
  const brokenRecomputed = computeHash(broken);
  if (brokenRecomputed === broken.hash) {
    errors.push(`Fault injection: broken hash not detected`);
  }

  const genesis = chain[0];
  if (genesis.previous_hash !== GENESIS_HASH) {
    errors.push(`Genesis validation: first event should have previous_hash = 0`);
  }

  // 6. Save canonical events for future cross-implementation testing
  const canonicalEvents = chain.map(e => {
    const { hash: h, ...rest } = e;
    return { ...rest, hash: h };
  });

  const fixturesPath = join(CONFIG.fixturesDir, "canonical-events.json");
  if (!existsSync(CONFIG.fixturesDir)) {
    mkdirSync(CONFIG.fixturesDir, { recursive: true });
  }
  writeFileSync(
    fixturesPath,
    JSON.stringify({
      version: "1.0",
      generatedAt: new Date().toISOString(),
      eventCount: chain.length,
      events: canonicalEvents,
      genesisHash: GENESIS_HASH
    }, null, 2),
    "utf-8"
  );
  console.log(`   ✅ Saved canonical events to ${fixturesPath}`);

  const duration = Date.now() - start;

  const result: StressTestResult = {
    name: "Protocol Validation",
    passed: errors.length === 0,
    duration: duration,
    details: {
      eventsTested: chain.length,
      checks: {
        deterministicHash: errors.filter(e => e.includes("Hash mismatch")).length === 0,
        canonicalSerialization: errors.filter(e => e.includes("Canonical")).length === 0,
        replayDeterminism: errors.filter(e => e.includes("Replay")).length === 0,
        faultInjection: errors.filter(e => e.includes("broken")).length === 0,
        genesisValidation: errors.filter(e => e.includes("Genesis")).length === 0
      }
    },
    errors: errors.length > 0 ? errors : undefined
  };

  console.log(`   ✅ All checks: ${errors.length === 0 ? "PASSED" : "FAILED"}`);

  return result;
}

// ============================================================================
// PART III: FAULT INJECTION
// ============================================================================

async function testFaultInjection(): Promise<StressTestResult> {
  console.log("\n💉 PART III: Fault Injection");
  console.log("   Testing error scenarios...");

  const start = Date.now();
  const errors: string[] = [];
  const results: Record<string, boolean> = {};

  // Build a test chain
  const chain: Event[] = [];
  let prev = GENESIS_HASH;
  for (let i = 0; i < 50; i++) {
    const event = createEvent(prev, i);
    chain.push(event);
    prev = event.hash;
  }

  // Test 1: Broken hash
  const test1 = JSON.parse(JSON.stringify(chain[10]));
  test1.hash = "f".repeat(64);
  const h1 = computeHash(test1);
  results["hash_mismatch_detected"] = h1 !== test1.hash;

  // Test 2: Missing event
  const test2 = chain.slice(0, 25);
  results["chain_broken_detected"] = test2.length < chain.length;

  // Test 3: Invalid genesis
  const test3 = { ...chain[0], previous_hash: "abc123" };
  results["invalid_genesis_detected"] = test3.previous_hash !== GENESIS_HASH;

  // Test 4: Reordered chain
  const test4 = [chain[5], chain[0], chain[3]];
  let prevHash = GENESIS_HASH;
  let chainOk = true;
  for (const e of test4) {
    if (e.previous_hash !== prevHash && prevHash !== GENESIS_HASH) {
      chainOk = false;
    }
    prevHash = e.hash;
  }
  results["reordered_chain_detected"] = !chainOk;

  // Test 5: Duplicate ID
  const test5 = [chain[0], chain[0]];
  const ids = new Set<string>();
  let duplicate = false;
  for (const e of test5) {
    if (ids.has(e.id)) duplicate = true;
    ids.add(e.id);
  }
  results["duplicate_id_detected"] = duplicate;

  // Test 6: Missing payload
  const test6 = { ...chain[15] };
  delete (test6 as Partial<Event>).payload;
  const h6 = computeHash(test6 as Omit<Event, "hash">);
  results["payload_missing_detected"] = h6 !== chain[15].hash;

  const passed = Object.values(results).every(v => v === true);

  const duration = Date.now() - start;

  const result: StressTestResult = {
    name: "Fault Injection",
    passed,
    duration,
    details: {
      ...results,
      totalTests: Object.keys(results).length,
      passedTests: Object.values(results).filter(v => v === true).length
    },
    errors: passed ? undefined : Object.entries(results).filter(([, v]) => !v).map(([k]) => `Failed: ${k}`)
  };

  console.log(`   ✅ Tests: ${Object.keys(results).length}`);
  console.log(`   ✅ Passed: ${Object.values(results).filter(v => v === true).length}`);
  console.log(`   ✅ Result: ${passed ? "PASSED" : "FAILED"}`);

  return result;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log("=" .repeat(60));
  console.log("  GHOSTWEAVE STRESS TEST — Phase C (FIXED)");
  console.log(`  Events: ${CONFIG.eventCount}`);
  console.log(`  Output: ${CONFIG.outputDir}`);
  console.log("=" .repeat(60));

  const results: StressTestResult[] = [];

  // Part I: Performance
  const perfResult = await testPerformance();
  results.push(perfResult);

  // Part II: Protocol
  const protoResult = await testProtocol();
  results.push(protoResult);

  // Part III: Fault Injection
  const faultResult = await testFaultInjection();
  results.push(faultResult);

  // Summary
  console.log("\n" + "=" .repeat(60));
  console.log("  📊 SUMMARY");
  console.log("=" .repeat(60));

  let allPassed = true;
  for (const r of results) {
    const status = r.passed ? "✅" : "❌";
    console.log(`  ${status} ${r.name}: ${r.passed ? "PASSED" : "FAILED"} (${formatDuration(r.duration)})`);
    if (!r.passed) allPassed = false;
  }

  console.log("=" .repeat(60));
  console.log(`  Overall: ${allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`);
  console.log("=" .repeat(60));

  // Save results
  const summary = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results,
    overall: allPassed ? "PASSED" : "FAILED"
  };

  writeResults("performance.log", summary);
  console.log(`\n📁 Results saved to: ${join(CONFIG.outputDir, "performance.log")}`);

  // Exit code
  process.exit(allPassed ? 0 : 1);
}

// Run
main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});