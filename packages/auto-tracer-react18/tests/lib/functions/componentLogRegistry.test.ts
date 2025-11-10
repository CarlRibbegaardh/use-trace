import { beforeEach, describe, expect, it } from "vitest";
import { componentLogRegistry } from "@src/lib/functions/componentLogRegistry.js";

describe("ComponentLogRegistry", () => {
  beforeEach(() => {
    // Clear the registry before each test
    componentLogRegistry.clear();
  });

  describe("addLog", () => {
    it("should add a log entry for a new component GUID", () => {
      const guid = "test-guid-1";
      const message = "Test message";
      const args = ["arg1", "arg2"];

      componentLogRegistry.addLog(guid, 'log', message, ...args);

      const logs = componentLogRegistry.consumeLogs(guid);
      expect(logs).toHaveLength(1);
      expect(logs[0]!.message).toBe(message);
      expect(logs[0]!.args).toEqual(args);
      expect(logs[0]!.timestamp).toBeTypeOf("number");
      expect(logs[0]!.level).toBe('log');
    });

    it("should add multiple log entries for the same component GUID", () => {
      const guid = "test-guid-2";

      componentLogRegistry.addLog(guid, 'log', "First message", "arg1");
      componentLogRegistry.addLog(guid, 'log', "Second message", "arg2");

      const logs = componentLogRegistry.consumeLogs(guid);
      expect(logs).toHaveLength(2);
      expect(logs[0]!.message).toBe("First message");
      expect(logs[1]!.message).toBe("Second message");
      expect(logs[0]!.args).toEqual(["arg1"]);
      expect(logs[1]!.args).toEqual(["arg2"]);
    });

    it("should handle logs for different component GUIDs separately", () => {
      const guid1 = "test-guid-1";
      const guid2 = "test-guid-2";

      componentLogRegistry.addLog(guid1, 'log', "Message for guid1");
      componentLogRegistry.addLog(guid2, 'log', "Message for guid2");

      const logs1 = componentLogRegistry.consumeLogs(guid1);
      const logs2 = componentLogRegistry.consumeLogs(guid2);

      expect(logs1).toHaveLength(1);
      expect(logs2).toHaveLength(1);
      expect(logs1[0]!.message).toBe("Message for guid1");
      expect(logs2[0]!.message).toBe("Message for guid2");
    });

    it("should handle logs with no arguments", () => {
      const guid = "test-guid-3";
      const message = "Message with no args";

      componentLogRegistry.addLog(guid, 'log', message);

      const logs = componentLogRegistry.consumeLogs(guid);
      expect(logs).toHaveLength(1);
      expect(logs[0]!.message).toBe(message);
      expect(logs[0]!.args).toEqual([]);
    });

    it("should handle logs with complex argument types", () => {
      const guid = "test-guid-4";
      const message = "Complex args";
      const complexArgs = [
        { key: "value" },
        [1, 2, 3],
        null,
        undefined,
        42,
        "string",
      ];

      componentLogRegistry.addLog(guid, 'log', message, ...complexArgs);

      const logs = componentLogRegistry.consumeLogs(guid);
      expect(logs).toHaveLength(1);
      expect(logs[0]!.args).toEqual(complexArgs);
    });
  });

  describe("consumeLogs", () => {
    it("should return empty array for non-existent GUID", () => {
      const logs = componentLogRegistry.consumeLogs("non-existent-guid");
      expect(logs).toEqual([]);
    });

    it("should return and remove logs for existing GUID", () => {
      const guid = "test-guid-5";
      componentLogRegistry.addLog(guid, 'log', "Test message");

      // First consumption should return the logs
      const logs1 = componentLogRegistry.consumeLogs(guid);
      expect(logs1).toHaveLength(1);
      expect(logs1[0]!.message).toBe("Test message");

      // Second consumption should return empty array
      const logs2 = componentLogRegistry.consumeLogs(guid);
      expect(logs2).toEqual([]);
    });

    it("should not affect other GUIDs when consuming logs", () => {
      const guid1 = "test-guid-1";
      const guid2 = "test-guid-2";

      componentLogRegistry.addLog(guid1, 'log', "Message 1");
      componentLogRegistry.addLog(guid2, 'log', "Message 2");

      // Consume logs for guid1
      const logs1 = componentLogRegistry.consumeLogs(guid1);
      expect(logs1).toHaveLength(1);

      // guid2 should still have its logs
      const logs2 = componentLogRegistry.consumeLogs(guid2);
      expect(logs2).toHaveLength(1);
      expect(logs2[0]!.message).toBe("Message 2");
    });
  });

  describe("clear", () => {
    it("should remove all logs from all GUIDs", () => {
      const guid1 = "test-guid-1";
      const guid2 = "test-guid-2";

      componentLogRegistry.addLog(guid1, 'log', "Message 1");
      componentLogRegistry.addLog(guid2, 'log', "Message 2");

      // Verify logs exist
      expect(componentLogRegistry.getLogCount()).toBe(2);

      // Clear all logs
      componentLogRegistry.clear();

      // Verify all logs are gone
      expect(componentLogRegistry.getLogCount()).toBe(0);
      expect(componentLogRegistry.consumeLogs(guid1)).toEqual([]);
      expect(componentLogRegistry.consumeLogs(guid2)).toEqual([]);
    });

    it("should work when no logs exist", () => {
      // Should not throw when clearing empty registry
      expect(() => {
        componentLogRegistry.clear();
      }).not.toThrow();
      expect(componentLogRegistry.getLogCount()).toBe(0);
    });
  });

  describe("getLogCount", () => {
    it("should return 0 when no logs exist", () => {
      expect(componentLogRegistry.getLogCount()).toBe(0);
    });

    it("should return correct count with single GUID", () => {
      const guid = "test-guid";

      componentLogRegistry.addLog(guid, 'log', "Message 1");
      expect(componentLogRegistry.getLogCount()).toBe(1);

      componentLogRegistry.addLog(guid, 'log', "Message 2");
      expect(componentLogRegistry.getLogCount()).toBe(2);

      componentLogRegistry.addLog(guid, 'log', "Message 3");
      expect(componentLogRegistry.getLogCount()).toBe(3);
    });

    it("should return correct count with multiple GUIDs", () => {
      const guid1 = "test-guid-1";
      const guid2 = "test-guid-2";
      const guid3 = "test-guid-3";

      componentLogRegistry.addLog(guid1, 'log', "Message 1");
      componentLogRegistry.addLog(guid2, 'log', "Message 2");
      componentLogRegistry.addLog(guid3, 'log', "Message 3");
      expect(componentLogRegistry.getLogCount()).toBe(3);

      componentLogRegistry.addLog(guid1, 'log', "Message 4");
      componentLogRegistry.addLog(guid2, 'log', "Message 5");
      expect(componentLogRegistry.getLogCount()).toBe(5);
    });

    it("should decrease count when logs are consumed", () => {
      const guid1 = "test-guid-1";
      const guid2 = "test-guid-2";

      componentLogRegistry.addLog(guid1, 'log', "Message 1");
      componentLogRegistry.addLog(guid2, 'log', "Message 2");
      expect(componentLogRegistry.getLogCount()).toBe(2);

      // Consume logs for guid1
      componentLogRegistry.consumeLogs(guid1);
      expect(componentLogRegistry.getLogCount()).toBe(1);

      // Consume logs for guid2
      componentLogRegistry.consumeLogs(guid2);
      expect(componentLogRegistry.getLogCount()).toBe(0);
    });

    it("should reset to 0 after clear", () => {
      const guid1 = "test-guid-1";
      const guid2 = "test-guid-2";

      componentLogRegistry.addLog(guid1, 'log', "Message 1");
      componentLogRegistry.addLog(guid2, 'log', "Message 2");
      expect(componentLogRegistry.getLogCount()).toBe(2);

      componentLogRegistry.clear();
      expect(componentLogRegistry.getLogCount()).toBe(0);
    });
  });

  describe("timestamp functionality", () => {
    it("should assign different timestamps to logs added at different times", async () => {
      const guid = "test-guid";

      componentLogRegistry.addLog(guid, 'log', "First message");

      // Wait a small amount to ensure timestamp difference
      await new Promise((resolve) => {
        setTimeout(resolve, 10); // Increase timeout to ensure timestamp difference
      });

      componentLogRegistry.addLog(guid, 'log', "Second message");

      const logs = componentLogRegistry.consumeLogs(guid);
      expect(logs).toHaveLength(2);
      expect(logs[1]!.timestamp).toBeGreaterThan(logs[0]!.timestamp);
    });

    it("should have valid timestamp format", () => {
      const guid = "test-guid";
      componentLogRegistry.addLog(guid, 'log', "Test message");

      const logs = componentLogRegistry.consumeLogs(guid);
      const timestamp = logs[0]!.timestamp;

      expect(typeof timestamp).toBe("number");
      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("log levels", () => {
    it("should store log level correctly for 'log'", () => {
      const guid = "test-guid";
      componentLogRegistry.addLog(guid, 'log', "Log message");

      const logs = componentLogRegistry.consumeLogs(guid);
      expect(logs[0]!.level).toBe('log');
    });

    it("should store log level correctly for 'warn'", () => {
      const guid = "test-guid";
      componentLogRegistry.addLog(guid, 'warn', "Warning message");

      const logs = componentLogRegistry.consumeLogs(guid);
      expect(logs[0]!.level).toBe('warn');
    });

    it("should store log level correctly for 'error'", () => {
      const guid = "test-guid";
      componentLogRegistry.addLog(guid, 'error', "Error message");

      const logs = componentLogRegistry.consumeLogs(guid);
      expect(logs[0]!.level).toBe('error');
    });

    it("should handle mixed log levels for same component", () => {
      const guid = "test-guid";
      componentLogRegistry.addLog(guid, 'log', "Log message");
      componentLogRegistry.addLog(guid, 'warn', "Warning message");
      componentLogRegistry.addLog(guid, 'error', "Error message");

      const logs = componentLogRegistry.consumeLogs(guid);
      expect(logs).toHaveLength(3);
      expect(logs[0]!.level).toBe('log');
      expect(logs[1]!.level).toBe('warn');
      expect(logs[2]!.level).toBe('error');
    });
  });
});
