import { beforeEach, describe, expect, it, afterEach } from "vitest";
import { buildTreeNode } from "../../../../../src/lib/functions/treeProcessing/building/buildTreeNode.js";
import { renderTree } from "../../../../../src/lib/functions/treeProcessing/rendering/renderTree.js";
import type { Hook } from "../../../../../src/lib/functions/hookMapping/types.js";
import { traceOptions } from "../../../../../src/lib/types/globalState.js";
import type { AutoTracerOptions } from "../../../../../src/lib/interfaces/AutoTracerOptions.js";
import {
  addLabelForGuid,
  clearAllHookLabels,
} from "../../../../../src/lib/functions/hookLabels.js";
import {
  registerTrackedGUID,
  clearRenderRegistry,
} from "../../../../../src/lib/functions/renderRegistry.js";

/**
 * Integration tests for initial prop/state logging in the new treeProcessing pipeline.
 *
 * These tests intentionally assert that on Mount we should see:
 *  - "Initial prop <name>: <value>"
 *  - "Initial state <name>: <value>"
 *
 * Current implementation builds only change deltas, so these tests are expected to FAIL
 * before we implement initial snapshot propagation in the build step.
 */

describe("treeProcessing rendering - initial values on mount", () => {
  // Capture console.log output
  let consoleOutput: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    // Reset to default-ish settings relevant for output
    Object.assign(traceOptions, {
      filterEmptyNodes: "none",
      includeReconciled: "always" as const,
      includeSkipped: "always" as const,
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: true,
      detectIdenticalValueChanges: false,
      showFlags: true,
    } satisfies Partial<AutoTracerOptions>);

    consoleOutput = [];
    console.log = (...args: unknown[]) => {
      consoleOutput.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    // Clean up registries
    clearAllHookLabels();
    clearRenderRegistry();

    // Restore console
    console.log = originalLog;
  });

  /**
   * Helper to create a tracking ref hook for useAutoTracer GUID
   */
  function createTrackingRefHook(guid: string): Hook {
    return {
      memoizedState: { current: guid },
      baseState: { current: guid },
      baseQueue: null,
      queue: null,
      next: null,
    } as unknown as Hook;
  }

  /**
   * Helper to create a useState hook
   */
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
    } as unknown as Hook;
  }

  /**
   * Helper to chain hooks
   */
  function chainHooks(hooks: Hook[]): Hook | null {
    if (hooks.length === 0) return null;
    for (let i = 0; i < hooks.length - 1; i++) {
      hooks[i]!.next = hooks[i + 1]!;
    }
    return hooks[0]!;
  }

  /**
   * Helper to create a minimal fiber for a tracked component with useState hooks
   */
  function createFiberWithUseState(
    componentName: string,
    hooks: Hook[],
    trackingGUID: string | null = null,
    props: Record<string, unknown> = {},
    alternate?: unknown
  ) {
    const allHooks = trackingGUID
      ? [createTrackingRefHook(trackingGUID), ...hooks]
      : hooks;
    const memoizedState = chainHooks(allHooks);
    const hookTypes = trackingGUID
      ? ["useRef", ...hooks.map(() => "useState")]
      : hooks.map(() => "useState");

    return {
      elementType: { name: componentName },
      type: { name: componentName },
      alternate, // no alternate => Mount
      flags: 1, // some work
      memoizedProps: props,
      pendingProps: props,
      memoizedState,
      _debugHookTypes: hookTypes,
    };
  }

  it("should render Initial state lines on mount (tracked, labeled)", () => {
    const guid = "render-track-mount-initial-state-guid";
    registerTrackedGUID(guid);

    // Simulate: const [title, setTitle] = useState("")
    const titleHook = createUseStateHook("");
    const fiber = createFiberWithUseState(
      "AddTodoForm",
      [titleHook],
      guid,
      {}
    );

    // Register label for the state variable as the injector would
    addLabelForGuid(guid, {
      label: "title",
      index: 0,
      value: "",
    });

    const node = buildTreeNode(fiber, 0);
    renderTree([node]);

    // Expect initial state to be printed on mount
    const hasInitialState = consoleOutput.some((l) =>
      l.includes("Initial state title:")
    );
    expect(hasInitialState).toBe(true);
  });

  it("should render Initial prop lines on mount (tracked)", () => {
  const guid = "render-track-mount-initial-props-guid";
    registerTrackedGUID(guid);

    const titleHook = createUseStateHook("");
    const props = { testProp: 123, children: "ignore me" };
    const fiber = createFiberWithUseState(
      "AddTodoForm",
      [titleHook],
      guid,
      props
    );

    // Label for completeness (not needed for props)
    addLabelForGuid(guid, { label: "title", index: 0, value: "" });

    const node = buildTreeNode(fiber, 0);
    renderTree([node]);

    // Expect initial prop to be printed on mount (children should be skipped)
    const hasInitialProp = consoleOutput.some((l) =>
      l.includes("Initial prop testProp:")
    );
    expect(hasInitialProp).toBe(true);
  });
});
