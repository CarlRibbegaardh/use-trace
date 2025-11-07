import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parse } from "flatted";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { walkFiberForUpdates } from "@src/lib/functions/walkFiberForUpdates.js";
import * as logFunctions from "@src/lib/functions/log.js";
import {
  clearAllHookLabels,
  addLabelForGuid,
} from "@src/lib/functions/hookLabels.js";
import { traceOptions } from "@src/lib/types/globalState.js";
import * as renderRegistry from "@src/lib/functions/renderRegistry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("walkFiberForUpdates with correct label mapping", () => {
  let logSpy: any;
  let consoleLogs: string[] = [];

  beforeEach(() => {
    // Reset modules and spies before each test
    vi.resetModules();
    clearAllHookLabels();
    consoleLogs = [];

    // Spy on the specific logStateChange function
    logSpy = vi
      .spyOn(logFunctions, "logStateChange")
      .mockImplementation((_prefix, message) => {
        consoleLogs.push(message);
      });

    // Set trace options for the test
    traceOptions.showFunctionContentOnChange = false;
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("should correctly label state changes based on the comprehensive hook blueprint", () => {
    // Arrange: Load the fiber node that demonstrated the bug
    const fixtureData = fs.readFileSync(
      path.join(
        __dirname,
        "../../fixtures/todoListFiberWithDispatch.fixture.flatted"
      ),
      "utf8"
    );
    const fiberNode = parse(fixtureData);

    // Fix: flatted can't serialize functions, so we need to restore elementType
    // This allows walkFiberForUpdates to recognize this as a component fiber
    if (!fiberNode.elementType) {
      fiberNode.elementType = function TodoList() {
        /* mock */
      };
    }

    // Arrange: Manually set the build-time labels as the babel plugin would
    const guid = "test-guid-123";
    // Map labels to the actual _debugHookTypes indices where stateful hooks appear
    // From the fixture analysis: useState at 0, useSyncExternalStore at 9, 18, 27, 36
    // Simulate the current render where loading changed from false to true
    const emptyArray: unknown[] = [];
    // Current render values (what's in the fiber now):
    addLabelForGuid(guid, { label: "dispatch", index: 0, value: null }); // useState at index 0
    addLabelForGuid(guid, { label: "filteredTodos", index: 9, value: emptyArray }); // useSyncExternalStore at index 9
    addLabelForGuid(guid, { label: "loading", index: 18, value: true }); // useSyncExternalStore at index 18 - NOW TRUE
    addLabelForGuid(guid, { label: "error", index: 27, value: null }); // useSyncExternalStore at index 27
    addLabelForGuid(guid, { label: "filter", index: 36, value: 'all' }); // useSyncExternalStore at index 36

    // This is a mock GUID that we pretend is attached to the fiber
    vi.spyOn(renderRegistry, "getTrackingGUID").mockReturnValue(guid);

    // Act: Walk the fiber to generate logs
    walkFiberForUpdates(fiberNode, 0);

    // Assert: Check if the logs contain the correctly labeled state changes
    const logOutput = consoleLogs.join("\\n");

    // These are the state changes from the fixture data, which represents a re-render
    // Based on the actual fixture data:
    // - loading changes from false (alternate) to true (current)
    // - filteredTodos is recalculated but has same value
    const expectedLog1 = "State change filteredTodos: [[]] → [[]]";
    const expectedLog2 = "State change loading: false → true";

    // This test will fail until the logic in walkFiberForUpdates is correct
    expect(logOutput).toContain(expectedLog1);
    expect(logOutput).toContain(expectedLog2);
  });
});
