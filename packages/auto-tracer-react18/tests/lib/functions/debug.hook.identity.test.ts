import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { extractUseStateValues } from "../../../src/lib/functions/extractUseStateValues.js";
import { findStatefulHookAnchors } from "../../../src/lib/functions/hookMapping/findStatefulHookAnchors.js";
import type { Hook } from "../../../src/lib/functions/hookMapping/types.js";
import { clearAllHookLabels } from "../../../src/lib/functions/hookLabels.js";
import { traceOptions } from "../../../src/lib/types/globalState.js";
import type { AutoTracerOptions } from "../../../src/lib/interfaces/AutoTracerOptions.js";

/**
 * Debug test to verify hook object identity between extractUseStateValues and findStatefulHookAnchors
 */
describe("Hook Identity Debug", () => {
  let consoleOutput: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    Object.assign(traceOptions, {
      filterEmptyNodes: "none",
      includeReconciled: "never" as const,
      includeSkipped: "never" as const,
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: true,
      detectIdenticalValueChanges: false,
    } satisfies Partial<AutoTracerOptions>);

    consoleOutput = [];
    console.log = (...args: unknown[]) => {
      consoleOutput.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    clearAllHookLabels();
    console.log = originalLog;
  });
  function createUseStateHook(value: unknown, prevValue?: unknown): Hook {
    return {
      memoizedState: value,
      baseState: prevValue ?? value,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null as unknown as (action: unknown) => void,
        lastRenderedReducer: null as unknown as (
          state: unknown,
          action: unknown
        ) => unknown,
        lastRenderedState: prevValue ?? value,
      },
      next: null,
    };
  }

  function chainHooks(hooks: Hook[]): Hook | null {
    if (hooks.length === 0) {
      return null;
    }

    for (let i = 0; i < hooks.length - 1; i++) {
      hooks[i]!.next = hooks[i + 1]!;
    }

    return hooks[0]!;
  }

  function createFiberWithUseState(hooks: Hook[], alternate?: unknown) {
    const memoizedState = chainHooks(hooks);

    return {
      memoizedState,
      alternate,
      _debugHookTypes: hooks.map(() => "useState"),
    };
  }

  it("should have matching hook references - same as walkFiberForUpdates does it", () => {
    // Replicate EXACTLY what walkFiberForUpdates does
    const titleHook = createUseStateHook("Hello", "");
    const loadingHook = createUseStateHook(true, false);

    const prevTitleHook = createUseStateHook("");
    const prevLoadingHook = createUseStateHook(false);
    const alternateFiber = createFiberWithUseState([
      prevTitleHook,
      prevLoadingHook,
    ]);
    const currentFiber = createFiberWithUseState(
      [titleHook, loadingHook],
      alternateFiber
    );

    // Step 1: Extract state values (like line 209 in walkFiberForUpdates)
    const useStateValues = extractUseStateValues(currentFiber);

    // Step 2: Filter for meaningful changes (like line 210-229)
    const meaningfulStateChanges = useStateValues.filter(
      ({ value, prevValue }) => {
        return prevValue !== undefined && prevValue !== value;
      }
    );

    // Step 3: Get anchors (like line 316-317)
    const memoizedState = currentFiber.memoizedState as Hook | null;
    const anchors = findStatefulHookAnchors(memoizedState);

    console.log("\n=== WALK FIBER FOR UPDATES SIMULATION ===");
    console.log("meaningfulStateChanges:", meaningfulStateChanges.length);
    console.log("anchors:", anchors.length);

    meaningfulStateChanges.forEach((change, idx) => {
      console.log(`\nChange[${idx}]:`);
      console.log("  value:", change.value);
      console.log("  prevValue:", change.prevValue);
      console.log("  hook:", change.hook);

      // Step 4: Find anchor index (like line 328)
      const anchorIndex = anchors.indexOf(change.hook as Hook);
      console.log("  anchorIndex from indexOf:", anchorIndex);

      // Manual check
      const manualCheck = anchors.findIndex((a) => a === change.hook);
      console.log("  manualCheck findIndex:", manualCheck);

      // Object identity check
      anchors.forEach((anchor, aIdx) => {
        const isSame = anchor === change.hook;
        console.log(`    anchor[${aIdx}] === hook: ${isSame}`);
      });
    });

    // Verify indexOf works
    expect(meaningfulStateChanges).toHaveLength(2);
    meaningfulStateChanges.forEach((change, idx) => {
      const anchorIndex = anchors.indexOf(change.hook as Hook);
      expect(anchorIndex).toBeGreaterThanOrEqual(0);
    });
  });

  it("should have matching hook references between extractUseStateValues and findStatefulHookAnchors", () => {
    // Create hooks
    const titleHook = createUseStateHook("Hello", "");
    const loadingHook = createUseStateHook(true, false);

    // Create fiber
    const prevTitleHook = createUseStateHook("");
    const prevLoadingHook = createUseStateHook(false);
    const alternateFiber = createFiberWithUseState([
      prevTitleHook,
      prevLoadingHook,
    ]);
    const currentFiber = createFiberWithUseState(
      [titleHook, loadingHook],
      alternateFiber
    );

    // Extract state values
    const stateValues = extractUseStateValues(currentFiber);

    // Get anchors
    const memoizedState = currentFiber.memoizedState as Hook | null;
    const anchors = findStatefulHookAnchors(memoizedState);

    // Debug output
    console.log("=== STATE VALUES ===");
    stateValues.forEach((sv, idx) => {
      console.log(`StateValue[${idx}]:`, {
        name: sv.name,
        value: sv.value,
        hookRef: sv.hook,
        hookId: (sv.hook as unknown as { id?: number }).id,
      });
    });

    console.log("\n=== ANCHORS ===");
    anchors.forEach((anchor, idx) => {
      console.log(`Anchor[${idx}]:`, {
        memoizedState: anchor.memoizedState,
        anchorRef: anchor,
        anchorId: (anchor as unknown as { id?: number }).id,
      });
    });

    console.log("\n=== IDENTITY CHECKS ===");
    stateValues.forEach((sv, svIdx) => {
      anchors.forEach((anchor, anchorIdx) => {
        const isIdentical = sv.hook === anchor;
        const isSame = Object.is(sv.hook, anchor);
        console.log(
          `StateValue[${svIdx}].hook === Anchor[${anchorIdx}]: ${isIdentical} (Object.is: ${isSame})`
        );
      });
    });

    console.log("\n=== INDEXOF CHECKS ===");
    stateValues.forEach((sv, idx) => {
      const indexInAnchors = anchors.indexOf(sv.hook as Hook);
      console.log(
        `StateValue[${idx}].hook indexOf in anchors: ${indexInAnchors}`
      );
      console.log(`  Hook type:`, typeof sv.hook);
      console.log(`  Hook constructor:`, sv.hook?.constructor.name);
      console.log(`  Is Hook?:`, sv.hook instanceof Object);
    });

    // Verify we have the expected number of hooks
    expect(stateValues).toHaveLength(2);
    expect(anchors).toHaveLength(2);

    // The CRITICAL test: Can we find the hooks using indexOf?
    const firstHookIndex = anchors.indexOf(stateValues[0]!.hook as Hook);
    const secondHookIndex = anchors.indexOf(stateValues[1]!.hook as Hook);

    console.log("\n=== FINAL RESULTS ===");
    console.log(`First hook index: ${firstHookIndex} (expected 0)`);
    console.log(`Second hook index: ${secondHookIndex} (expected 1)`);

    expect(firstHookIndex).toBe(0);
    expect(secondHookIndex).toBe(1);
  });
});
