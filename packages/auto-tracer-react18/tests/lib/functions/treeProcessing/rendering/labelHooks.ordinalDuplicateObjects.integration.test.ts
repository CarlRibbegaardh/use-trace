import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildTreeNode } from "../../../../../src/lib/functions/treeProcessing/building/buildTreeNode.js";
import { renderTree } from "../../../../../src/lib/functions/treeProcessing/rendering/renderTree.js";
import type { Hook } from "../../../../../src/lib/functions/hookMapping/types.js";
import { traceOptions } from "../../../../../src/lib/types/globalState.js";
import { registerTrackedGUID, clearRenderRegistry } from "../../../../../src/lib/functions/renderRegistry.js";
import { addLabelForGuid, clearAllHookLabels } from "../../../../../src/lib/functions/hookLabels.js";

/**
 * Integration test for ordinal resolution of custom hooks with identical object structure.
 *
 * Scenario:
 * - Two custom hooks both return objects with same structure: { value: string, setValue: fn }
 * - Both objects normalize to the same comparable string: { value: "...", setValue: "(fn)" }
 * - Ordinal matching should distinguish them by source position
 * - Expected: customHookResult labeled correctly, nestedHookResult labeled correctly
 * - Bug: Both hooks may be labeled as the first one (customHookResult)
 */

describe("treeProcessing rendering - ordinal resolution for duplicate object structures", () => {
  let output: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    Object.assign(traceOptions, {
      filterEmptyNodes: "none",
      includeReconciled: true,
      includeSkipped: true,
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: true,
      detectIdenticalValueChanges: false,
      showFlags: true,
    });

    output = [];
    console.log = (...args: unknown[]) => {
      output.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    console.log = originalLog;
    clearRenderRegistry();
    clearAllHookLabels();
  });

  function createTrackingRefHook(guid: string): Hook {
    return {
      memoizedState: { current: guid },
      baseState: { current: guid },
      baseQueue: null,
      queue: null,
      next: null,
    } as unknown as Hook;
  }

  function createUseStateHook(value: unknown, prevValue?: unknown): Hook {
    return {
      memoizedState: value,
      baseState: prevValue ?? value,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null as unknown as (action: unknown) => void,
        lastRenderedReducer: null as unknown as (state: unknown, action: unknown) => unknown,
        lastRenderedState: prevValue ?? value,
      },
      next: null,
    } as unknown as Hook;
  }

  function chainHooks(hooks: Hook[]): Hook | null {
    if (hooks.length === 0) return null;
    for (let i = 0; i < hooks.length - 1; i++) {
      hooks[i]!.next = hooks[i + 1]!;
    }
    return hooks[0]!;
  }

  /**
   * Creates a fiber that mimics:
   * const logger = useAutoTracer({ name: "LabelHooksPatternTestComponent" });
   * const [description, setDescription] = useState("pattern-test");
   * const [counter, dispatchCounter] = useReducer(..., 10);
   * const customHookResult = useCustomHook("pattern-custom");
   * const nestedHookResult = useCustomHook2WithCustomHookInside();
   *
   * logger.labelState(0, "description", description, "setDescription", setDescription);
   * logger.labelState(1, "counter", counter, "dispatchCounter", dispatchCounter);
   * logger.labelState(2, "customHookResult", customHookResult);
   * logger.labelState(3, "nestedHookResult", nestedHookResult);
   */
  function createFiber(
    componentName: string,
    guid: string,
    hookValues: Array<unknown>
  ) {
    const tracking = createTrackingRefHook(guid);
    const hooks = hookValues.map((v) => createUseStateHook(v));
    const chain = chainHooks([tracking, ...hooks]);
    return {
      elementType: { name: componentName },
      type: { name: componentName },
      alternate: null, // Mount
      flags: 1,
      memoizedProps: {},
      pendingProps: {},
      memoizedState: chain,
      _debugHookTypes: ["useRef", ...hooks.map(() => "useState")],
    };
  }

  it("should distinguish two custom hooks with identical object structure using ordinal position", () => {
    const guid = "render-track-label-hooks-ordinal-duplicate-objects-guid";
    registerTrackedGUID(guid);

    // Hook values: description(string), counter(number), customHookResult(object), nestedHookResult(object)
    // Both objects have IDENTICAL structure: { value: string, setValue: function }
    const customHookValue = { value: "pattern-custom", setValue: () => {} };
    const nestedHookValue = { value: "nested-custom", setValue: () => {} };

    const fiber = createFiber("LabelHooksPatternTestComponent", guid, [
      "pattern-test",
      10,
      customHookValue,
      nestedHookValue,
    ]);

    // Simulate manual labelState() calls performed by the component/injector
    addLabelForGuid(guid, { label: "description", index: 0, value: "pattern-test" });
    addLabelForGuid(guid, { label: "counter", index: 1, value: 10 });
    addLabelForGuid(guid, { label: "customHookResult", index: 2, value: customHookValue });
    addLabelForGuid(guid, { label: "nestedHookResult", index: 3, value: nestedHookValue });

    const node = buildTreeNode(fiber, 0);
    renderTree([node]);

    // Expect primitive hooks to be labeled correctly
    const hasDescription = output.some(l => l.includes("Initial state description:") && l.includes("pattern-test"));
    const hasCounter = output.some(l => l.includes("Initial state counter:") && l.includes("10"));
    expect(hasDescription).toBe(true);
    expect(hasCounter).toBe(true);

    // CRITICAL: Both custom hooks should be labeled with their CORRECT labels (ordinal resolution)
    // customHookResult should show "pattern-custom"
    const hasCustomHookResult = output.some(l =>
      l.includes("Initial state customHookResult:") && l.includes("pattern-custom")
    );
    expect(hasCustomHookResult).toBe(true);

    // nestedHookResult should show "nested-custom" (NOT "customHookResult")
    const hasNestedHookResult = output.some(l =>
      l.includes("Initial state nestedHookResult:") && l.includes("nested-custom")
    );
    expect(hasNestedHookResult).toBe(true);

    // Ensure nestedHookResult is NOT mislabeled as customHookResult
    const nestedMislabeled = output.some(l =>
      l.includes("Initial state customHookResult:") && l.includes("nested-custom")
    );
    expect(nestedMislabeled).toBe(false);
  });
});
