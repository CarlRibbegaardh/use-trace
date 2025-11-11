import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildTreeNode } from "../../../../../src/lib/functions/treeProcessing/building/buildTreeNode.js";
import { renderTree } from "../../../../../src/lib/functions/treeProcessing/rendering/renderTree.js";
import type { Hook } from "../../../../../src/lib/functions/hookMapping/types.js";
import { traceOptions } from "../../../../../src/lib/types/globalState.js";
import { registerTrackedGUID, clearRenderRegistry } from "../../../../../src/lib/functions/renderRegistry.js";
import { addLabelForGuid, clearAllHookLabels } from "../../../../../src/lib/functions/hookLabels.js";

/**
 * Integration test reproducing manual labelState usage with custom hooks whose values are objects.
 * Verifies that primitive state hooks (title, count) resolve labels while object-returning custom hooks
 * currently fall back to "unknown" due to value/structure matching limitations.
 */

describe("treeProcessing rendering - custom hook labels resolve for object-returning custom hooks", () => {
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
   * const logger = useAutoTracer({ name: "LabelHooksTestComponent" });
   * const [title,setTitle] = useState("test-title");
   * const [count,dispatch] = useReducer(...,0);
   * const custom = useCustomHook("test-custom"); // returns { value: string, setValue: fn }
   * const nested = useCustomHook2WithCustomHookInside(); // returns { value: string, setValue: fn }
   * logger.labelState(0, "title", title, "setTitle", setTitle);
   * logger.labelState(1, "count", count, "dispatch", dispatch);
   * logger.labelState(2, "custom", custom);
   * logger.labelState(3, "nested", nested);
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

  it("should label primitive hooks AND object-returning custom hooks on mount", () => {
    const guid = "render-track-label-hooks-custom-unknown-guid";
    registerTrackedGUID(guid);

    // Hook values: title(string), count(number), custom(object), nested(object)
    const fiber = createFiber("LabelHooksTestComponent", guid, [
      "test-title",
      0,
      { value: "test-custom", setValue: () => {} },
      { value: "nested-custom", setValue: () => {} },
    ]);

    // Simulate manual labelState() calls performed by the component/injector
    addLabelForGuid(guid, { label: "title", index: 0, value: "test-title" });
    addLabelForGuid(guid, { label: "count", index: 1, value: 0 });
    addLabelForGuid(guid, { label: "custom", index: 2, value: { value: "test-custom", setValue: () => {} } });
    addLabelForGuid(guid, { label: "nested", index: 3, value: { value: "nested-custom", setValue: () => {} } });

    const node = buildTreeNode(fiber, 0);
    renderTree([node]);

    // Expect labeled primitives
    const hasTitle = output.some(l => l.includes("Initial state title:"));
    const hasCount = output.some(l => l.includes("Initial state count:"));
    expect(hasTitle).toBe(true);
    expect(hasCount).toBe(true);

    // Expect custom/nested now resolved (no 'unknown')
    const hasCustomResolved = output.some(l => l.includes("Initial state custom:") && l.includes("test-custom"));
    const hasNestedResolved = output.some(l => l.includes("Initial state nested:") && l.includes("nested-custom"));
    expect(hasCustomResolved).toBe(true);
    expect(hasNestedResolved).toBe(true);

    // Ensure we did not log them as unknown anymore
    const anyUnknownWithCustomValues = output.some(l => l.includes("Initial state unknown:") && (l.includes("test-custom") || l.includes("nested-custom")));
    expect(anyUnknownWithCustomValues).toBe(false);
  });
});
