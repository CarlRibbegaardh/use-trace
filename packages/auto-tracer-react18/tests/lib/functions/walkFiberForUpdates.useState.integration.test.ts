import { beforeEach, describe, expect, it, afterEach, vi } from "vitest";
import {
  walkFiberForUpdates,
  resetDepthTracking,
} from "../../../src/lib/functions/walkFiberForUpdates.js";
import type { Hook } from "../../../src/lib/functions/hookMapping/types.js";
import { traceOptions } from "../../../src/lib/types/globalState.js";
import type { AutoTracerOptions } from "../../../src/lib/interfaces/AutoTracerOptions.js";
import {
  addLabelForGuid,
  clearAllHookLabels,
} from "../../../src/lib/functions/hookLabels.js";
import {
  registerTrackedGUID,
  clearRenderRegistry,
} from "../../../src/lib/functions/renderRegistry.js";

/**
 * Integration tests for useState label resolution in walkFiberForUpdates (OLD CODE).
 *
 * These tests verify that the OLD implementation works correctly.
 * We're testing the EXACT same scenarios as buildTreeNode.useState.integration.test.ts
 * to prove whether the regression is in the new code or was already present.
 */

describe("walkFiberForUpdates - useState label resolution integration (OLD CODE)", () => {
  // Capture console.log output
  let consoleOutput: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    // Reset to default settings
    Object.assign(traceOptions, {
      filterEmptyNodes: "none",
      includeReconciled: false,
      includeSkipped: false,
      enableAutoTracerInternalsLogging: false,
      includeNonTrackedBranches: true,
      detectIdenticalValueChanges: false,
    } satisfies Partial<AutoTracerOptions>);

    // Reset depth tracking
    resetDepthTracking();

    // Capture console.log
    consoleOutput = [];
    console.log = (...args: unknown[]) => {
      consoleOutput.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    // Clean up label registry after each test
    clearAllHookLabels();

    // Clean up render registry (tracked GUIDs)
    clearRenderRegistry();

    // Restore console.log
    console.log = originalLog;
  });

  /**
   * Helper to create a useRef hook for tracking
   */
  function createTrackingRefHook(guid: string): Hook {
    return {
      memoizedState: { current: guid },
      baseState: { current: guid },
      baseQueue: null,
      queue: null,
      next: null,
    };
  }

  /**
   * Helper to create a useState hook in the hook chain
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
    };
  }

  /**
   * Helper to chain hooks together
   */
  function chainHooks(hooks: Hook[]): Hook | null {
    if (hooks.length === 0) {
      return null;
    }

    for (let i = 0; i < hooks.length - 1; i++) {
      hooks[i]!.next = hooks[i + 1]!;
    }

    return hooks[0]!;
  }

  /**
   * Helper to create a minimal fiber with useState hooks
   */
  function createFiberWithUseState(
    componentName: string,
    hooks: Hook[],
    trackingGUID: string | null = null,
    alternate?: unknown
  ) {
    // If trackingGUID is provided, prepend a ref hook for tracking
    const allHooks = trackingGUID
      ? [createTrackingRefHook(trackingGUID), ...hooks]
      : hooks;

    const memoizedState = chainHooks(allHooks);

    return {
      elementType: { name: componentName },
      type: { name: componentName },
      alternate,
      flags: 1, // Has some work (Update flag)
      memoizedProps: {},
      pendingProps: {},
      memoizedState,
      _debugHookTypes: allHooks.map((_, idx) =>
        idx === 0 && trackingGUID ? "useRef" : "useState"
      ),
      // No children or siblings for simplicity
      child: null,
      sibling: null,
    };
  }

  /**
   * Helper to find state change log in console output
   */
  function findStateChangeLog(label: string): string | undefined {
    return consoleOutput.find((log) => log.includes(`State change ${label}:`));
  }

  describe("Single useState hook", () => {
    it("should resolve useState variable name on update", () => {
      const guid = "render-track-test-component-guid";

      // Create a component with one useState hook: const [title, setTitle] = useState("")
      const titleHook = createUseStateHook("Hello", "");

      // Create previous fiber (for alternate)
      const prevTitleHook = createUseStateHook("");
      const alternateFiber = createFiberWithUseState(
        "AddTodoForm",
        [prevTitleHook],
        guid
      );

      // Create current fiber with updated state
      const currentFiber = createFiberWithUseState(
        "AddTodoForm",
        [titleHook],
        guid,
        alternateFiber
      );

      // Register the GUID as tracked (simulates useAutoTracer())
      registerTrackedGUID(guid);

      // Register the label as the Babel plugin would do
      addLabelForGuid(guid, {
        label: "title",
        index: 0,
        value: "Hello",
      });

      // Call the old walkFiberForUpdates code
      walkFiberForUpdates(currentFiber, 0);

      // Check if the label was resolved correctly in the logs
      const stateChangeLog = findStateChangeLog("title");

      // DEBUG: Use expect to show what we captured (will appear in error)
      if (!stateChangeLog) {
        expect(consoleOutput).toEqual(["EXPECTED_TO_FIND_LOGS_BUT_GOT_THIS"]);
      }

      expect(stateChangeLog).toBeDefined();
      expect(stateChangeLog).toContain("State change title:");
      expect(stateChangeLog).toContain("→ Hello"); // String values aren't quoted in logs
    });

    it("should resolve useState variable name when value changes", () => {
      // Create a component with loading state: const [loading, setLoading] = useState(false)
      const loadingHook = createUseStateHook(true, false);
      const guid = "render-track-todolist-guid";
      registerTrackedGUID(guid);

      const prevLoadingHook = createUseStateHook(false);
      const alternateFiber = createFiberWithUseState(
        "TodoList",
        [prevLoadingHook],
        guid
      );

      const currentFiber = createFiberWithUseState(
        "TodoList",
        [loadingHook],
        guid,
        alternateFiber
      );

      // Register the label with the NEW value
      addLabelForGuid(guid, {
        label: "loading",
        index: 0,
        value: true,
      });

      walkFiberForUpdates(currentFiber, 0);

      // Check if the label was resolved correctly
      const stateChangeLog = findStateChangeLog("loading");
      expect(stateChangeLog).toBeDefined();
      expect(stateChangeLog).toContain("State change loading:");
      expect(stateChangeLog).toContain("false → true");
    });
  });

  describe("Multiple useState hooks", () => {
    it("should resolve multiple useState variable names correctly", () => {
      // Component with two useState hooks:
      // const [title, setTitle] = useState("")
      // const [description, setDescription] = useState("")

      const titleHook = createUseStateHook("Hello", "");
      const descriptionHook = createUseStateHook("World", "");
      const guid = "render-track-form-guid";
      registerTrackedGUID(guid);

      const prevTitleHook = createUseStateHook("");
      const prevDescriptionHook = createUseStateHook("");
      const alternateFiber = createFiberWithUseState(
        "AddTodoForm",
        [prevTitleHook, prevDescriptionHook],
        guid
      );

      const currentFiber = createFiberWithUseState(
        "AddTodoForm",
        [titleHook, descriptionHook],
        guid,
        alternateFiber
      );

      // Register both labels with their NEW values
      addLabelForGuid(guid, {
        label: "title",
        index: 0,
        value: "Hello",
      });
      addLabelForGuid(guid, {
        label: "description",
        index: 1,
        value: "World",
      });

      walkFiberForUpdates(currentFiber, 0);

      // Check both labels were resolved
      const titleLog = findStateChangeLog("title");
      const descriptionLog = findStateChangeLog("description");

      expect(titleLog).toBeDefined();
      expect(titleLog).toContain("State change title:");
      expect(titleLog).toContain("→ Hello"); // String values aren't quoted in logs

      expect(descriptionLog).toBeDefined();
      expect(descriptionLog).toContain("State change description:");
      expect(descriptionLog).toContain("→ World"); // String values aren't quoted in logs
    });

    it("should handle mixed hooks (only one changing)", () => {
      // Two useState hooks, but only one changes
      const titleHook = createUseStateHook("Hello", "");
      const descriptionHook = createUseStateHook("", ""); // Unchanged
      const guid = "render-track-form-guid-2";
      registerTrackedGUID(guid);

      const prevTitleHook = createUseStateHook("");
      const prevDescriptionHook = createUseStateHook("");
      const alternateFiber = createFiberWithUseState(
        "AddTodoForm",
        [prevTitleHook, prevDescriptionHook],
        guid
      );

      const currentFiber = createFiberWithUseState(
        "AddTodoForm",
        [titleHook, descriptionHook],
        guid,
        alternateFiber
      );

      // Register both labels even though only one changes
      addLabelForGuid(guid, {
        label: "title",
        index: 0,
        value: "Hello",
      });
      addLabelForGuid(guid, {
        label: "description",
        index: 1,
        value: "",
      });

      walkFiberForUpdates(currentFiber, 0);

      // Only title should show (description didn't change)
      const titleLog = findStateChangeLog("title");
      expect(titleLog).toBeDefined();
      expect(titleLog).toContain("State change title:");

      // Description should NOT appear (no change)
      const descriptionLog = findStateChangeLog("description");
      expect(descriptionLog).toBeUndefined();
    });
  });

  describe("Mount scenario", () => {
    it("should handle initial mount with useState", () => {
      // On mount, there's no alternate fiber
      const titleHook = createUseStateHook("");
      const guid = "render-track-form-guid-mount";
      registerTrackedGUID(guid);

      const currentFiber = createFiberWithUseState(
        "AddTodoForm",
        [titleHook],
        guid,
        null // No alternate on mount
      );

      // Remove alternate flag to simulate mount
      delete (currentFiber as { alternate?: unknown }).alternate;

      // Register label
      addLabelForGuid(guid, {
        label: "title",
        index: 0,
        value: "",
      });

      walkFiberForUpdates(currentFiber, 0);

      // On mount, should show "Initial state" not "State change"
      const initialStateLog = consoleOutput.find((log) =>
        log.includes("Initial state title:")
      );
      expect(initialStateLog).toBeDefined();

      // Should NOT show state change
      const stateChangeLog = findStateChangeLog("title");
      expect(stateChangeLog).toBeUndefined();
    });
  });
});
