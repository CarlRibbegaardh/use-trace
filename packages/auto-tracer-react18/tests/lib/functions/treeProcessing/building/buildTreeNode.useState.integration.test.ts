import { beforeEach, describe, expect, it, afterEach } from "vitest";
import { buildTreeNode } from "../../../../../src/lib/functions/treeProcessing/building/buildTreeNode.js";
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
 * Integration tests for useState label resolution in buildTreeNode.
 *
 * These tests verify that:
 * 1. useState hooks get their proper variable names resolved
 * 2. Hook anchor matching works correctly
 * 3. Both mount and update scenarios are handled
 *
 * These tests should FAIL initially, proving the bug exists at integration level
 * before we fix it in the E2E tests.
 */

describe("buildTreeNode - useState label resolution integration", () => {
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
  });

  afterEach(() => {
    // Clean up label registry and render tracking after each test
    clearAllHookLabels();
    clearRenderRegistry();
  });

  /**
   * Helper to create a tracking ref hook
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
    // If trackingGUID provided, prepend a ref hook
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
      alternate,
      flags: 1, // Has some work (Update flag)
      memoizedProps: {},
      pendingProps: {},
      memoizedState,
      _debugHookTypes: hookTypes,
    };
  }

  describe("Single useState hook", () => {
    it("should resolve useState variable name on update", () => {
      // Create a component with one useState hook: const [title, setTitle] = useState("")
      const titleHook = createUseStateHook("Hello", "");
      const guid = "render-track-test-component-guid";
      registerTrackedGUID(guid);

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

      // Register the label as the Babel plugin would do
      // The label is registered with the NEW value after state change
      addLabelForGuid(guid, {
        label: "title",
        index: 0,
        value: "Hello",
      });

      const treeNode = buildTreeNode(currentFiber, 0);

      // Debug: Log what we got
      console.log("State changes:", treeNode.stateChanges);
      if (treeNode.stateChanges[0]) {
        console.log("First state change name:", treeNode.stateChanges[0].name);
        console.log(
          "First state change value:",
          treeNode.stateChanges[0].value
        );
        console.log("First state change hook:", treeNode.stateChanges[0].hook);
      }

      // Now this should pass with the label registered
      expect(treeNode.stateChanges).toHaveLength(1);
      expect(treeNode.stateChanges[0]?.name).toBe("title");
      expect(treeNode.stateChanges[0]?.value).toBe("Hello");
      expect(treeNode.stateChanges[0]?.prevValue).toBe("");
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

      const treeNode = buildTreeNode(currentFiber, 0);

      // Should pass with label registered
      expect(treeNode.stateChanges).toHaveLength(1);
      expect(treeNode.stateChanges[0]?.name).toBe("loading");
      expect(treeNode.stateChanges[0]?.value).toBe(true);
      expect(treeNode.stateChanges[0]?.prevValue).toBe(false);
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

      const treeNode = buildTreeNode(currentFiber, 0);

      // Should pass with labels registered
      expect(treeNode.stateChanges).toHaveLength(2);

      // First hook should be "title"
      expect(treeNode.stateChanges[0]?.name).toBe("title");
      expect(treeNode.stateChanges[0]?.value).toBe("Hello");
      expect(treeNode.stateChanges[0]?.prevValue).toBe("");

      // Second hook should be "description"
      expect(treeNode.stateChanges[1]?.name).toBe("description");
      expect(treeNode.stateChanges[1]?.value).toBe("World");
      expect(treeNode.stateChanges[1]?.prevValue).toBe("");
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

      const treeNode = buildTreeNode(currentFiber, 0);

      // Only one state change (title changed, description didn't)
      expect(treeNode.stateChanges).toHaveLength(1);
      expect(treeNode.stateChanges[0]?.name).toBe("title");
      expect(treeNode.stateChanges[0]?.value).toBe("Hello");
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

      const treeNode = buildTreeNode(currentFiber, 0);

      // On mount, we surface initial state entries (prevValue is undefined)
      expect(treeNode.renderType).toBe("Mount");
      expect(treeNode.stateChanges).toHaveLength(1);
      expect(treeNode.stateChanges[0]?.prevValue).toBeUndefined();
    });
  });

  describe("Hook chain integrity", () => {
    it("should maintain hook chain references correctly", () => {
      // This test verifies that the hook references from extractUseStateValues
      // are the SAME objects as those from findStatefulHookAnchors
      // This is critical for indexOf to work

      const hook1 = createUseStateHook("value1", "prev1");
      const hook2 = createUseStateHook("value2", "prev2");
      const hook3 = createUseStateHook("value3", "prev3");
      const guid = "render-track-test-guid-chain";
      registerTrackedGUID(guid);

      const prevHook1 = createUseStateHook("prev1");
      const prevHook2 = createUseStateHook("prev2");
      const prevHook3 = createUseStateHook("prev3");

      const alternateFiber = createFiberWithUseState(
        "TestComponent",
        [prevHook1, prevHook2, prevHook3],
        guid
      );

      const currentFiber = createFiberWithUseState(
        "TestComponent",
        [hook1, hook2, hook3],
        guid,
        alternateFiber
      );

      const treeNode = buildTreeNode(currentFiber, 0);

      // All three hooks changed
      expect(treeNode.stateChanges).toHaveLength(3);

      // Each should have a unique name (even if it's "unknown")
      // The key is that we should be able to resolve them at all
      expect(treeNode.stateChanges[0]?.hook).toBe(hook1);
      expect(treeNode.stateChanges[1]?.hook).toBe(hook2);
      expect(treeNode.stateChanges[2]?.hook).toBe(hook3);
    });
  });
});
