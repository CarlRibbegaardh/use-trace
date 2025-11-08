import { describe, it, expect } from "vitest";
import * as logModule from "@src/lib/functions/log.js";

/**
 * Spec requires two distinct exported functions:
 * - logIdenticalStateValueWarning(prefix, message)
 * - logIdenticalPropValueWarning(prefix, message)
 * This test asserts their existence and callable signatures.
 */
describe("log module identical value warning exports (spec)", () => {
  it("should export logIdenticalStateValueWarning", () => {
    expect(typeof (logModule as any).logIdenticalStateValueWarning).toBe(
      "function"
    );
  });

  it("should export logIdenticalPropValueWarning", () => {
    expect(typeof (logModule as any).logIdenticalPropValueWarning).toBe(
      "function"
    );
  });
});
