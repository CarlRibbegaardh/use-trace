import { describe, it, expect } from "vitest";
import { defaultAutoTracerOptions } from "@src/lib/types/defaultSettings.js";

/**
 * Spec: detectIdenticalValueChanges is a boolean and defaults to true.
 * Spec: Colors contain distinct identicalStateValueWarning and identicalPropValueWarning with an icon.
 */
describe("defaults - detectIdenticalValueChanges", () => {
  it("should expose detectIdenticalValueChanges as a boolean enabled by default", () => {
    // boolean property present
    expect(typeof defaultAutoTracerOptions.detectIdenticalValueChanges).toBe(
      "boolean"
    );
    // default true per spec
    expect(defaultAutoTracerOptions.detectIdenticalValueChanges).toBe(true);
  });

  it("should define distinct color configs for identical state/prop warnings with icon", () => {
    const colors = defaultAutoTracerOptions.colors;
    expect(colors).toBeDefined();
    // distinct entries required by spec
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const stateCfg = colors!.identicalStateValueWarning;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const propCfg = colors!.identicalPropValueWarning;
    expect(stateCfg).toBeDefined();
    expect(propCfg).toBeDefined();
    // must include warning icon
    expect(stateCfg?.icon).toBe("⚠️");
    expect(propCfg?.icon).toBe("⚠️");
  });
});
