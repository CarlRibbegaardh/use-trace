import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { walkFiberForUpdates } from "@src/lib/functions/walkFiberForUpdates.js";
import * as logFunctions from "@src/lib/functions/log.js";
import { loadFixture } from "@test/fixtures/loadFixture.js";
import {
  clearAllHookLabels,
  addLabelForGuid,
} from "@src/lib/functions/hookLabels.js";
import { traceOptions } from "@src/lib/types/globalState.js";
import * as renderRegistry from "@src/lib/functions/renderRegistry.js";

describe("walkFiberForUpdates with correct label mapping", () => {
  let logSpy: vi.SpyInstance;
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
    const fiberNode = loadFixture(
      "todoListFiberWithDispatch.fixture.flatted"
    ) as any;

    // Arrange: Manually set the build-time labels as the babel plugin would
    const guid = "test-guid-123";
    // This mirrors the actual hook order in the TodoList component
    addLabelForGuid(guid, "useAutoTracer", 0); // The tracer itself
    addLabelForGuid(guid, "useAppSelector", 1); // Custom hook
    addLabelForGuid(guid, "useAppDispatch", 2); // Custom hook (no queue)
    addLabelForGuid(guid, "useState", 3); // 'error' state
    addLabelForGuid(guid, "useState", 4); // 'filter' state

    // This is a mock GUID that we pretend is attached to the fiber
    vi.spyOn(renderRegistry, "getTrackingGUID").mockReturnValue(guid);

    // Act: Walk the fiber to generate logs
    walkFiberForUpdates(fiberNode, 0);

    // Assert: Check if the logs contain the correctly labeled state changes
    const logOutput = consoleLogs.join("\\n");

    // These are the state changes from the fixture data, which represents a re-render
    // where 'loading' becomes false and 'filteredTodos' is recalculated.
    const expectedLog1 = "State change filteredTodos: [[]] → [[]]";
    const expectedLog2 = "State change loading: true → false";

    // This test will fail until the logic in walkFiberForUpdates is correct
    expect(logOutput).toContain(expectedLog1);
    expect(logOutput).toContain(expectedLog2);
  });
});
