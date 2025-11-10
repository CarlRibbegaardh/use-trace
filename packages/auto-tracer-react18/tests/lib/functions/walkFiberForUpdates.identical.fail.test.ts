import { describe, it, expect, vi } from "vitest";
import { walkFiberForUpdates } from "@src/lib/functions/walkFiberForUpdates.js";
import * as logModule from "@src/lib/functions/log.js";
import { traceOptions } from "@src/lib/types/globalState.js";
import { stringify } from "@src/lib/functions/stringify.js";
import * as renderRegistry from "@src/lib/functions/renderRegistry.js";

function buildFiber({
  prevProps,
  nextProps,
  prevState,
  nextState,
}: {
  prevProps?: Record<string, unknown>;
  nextProps?: Record<string, unknown>;
  prevState?: unknown;
  nextState?: unknown;
}) {
  return {
    elementType: () => null,
    flags: 1,
    alternate: {
      memoizedProps: prevProps,
      memoizedState: prevState,
    },
    memoizedProps: nextProps,
    pendingProps: nextProps,
    memoizedState: nextState,
  };
}

describe("walkFiberForUpdates identical value detection (spec)", () => {
  it("should flag identical array prop content changes with warning logger", () => {
  traceOptions.detectIdenticalValueChanges = true;
  traceOptions.includeNonTrackedBranches = true;
  vi.spyOn(renderRegistry, "getTrackingGUID").mockReturnValue("identical-prop-guid");
    const prevProps = { items: [1, 2, 3] };
    const nextProps = { items: [1, 2, 3] }; // new reference identical content
    expect(prevProps.items).not.toBe(nextProps.items);
    expect(stringify(prevProps.items)).toBe(stringify(nextProps.items));
    const fiber = buildFiber({ prevProps, nextProps });
    const spy = vi.spyOn(logModule, "logIdenticalPropValueWarning");
    walkFiberForUpdates(fiber, 0);
    expect(spy).toHaveBeenCalledTimes(1);
  const call0 = spy.mock.calls[0] ?? ["", ""];
  const msg = call0[1] as string;
    expect(msg).toMatch(/Prop change items \(identical value\):/);
    spy.mockRestore();
  });

  it("should flag identical object state content changes with warning logger", () => {
    traceOptions.detectIdenticalValueChanges = true;
    traceOptions.includeNonTrackedBranches = true;
    vi.spyOn(renderRegistry, "getTrackingGUID").mockReturnValue("identical-state-guid");
    // Build proper useState-like hooks (queue present)
    const prevState = { memoizedState: { a: 1, b: 2 }, queue: {}, next: null };
    const nextState = { memoizedState: { a: 1, b: 2 }, queue: {}, next: null };
    expect(prevState.memoizedState).not.toBe(nextState.memoizedState);
    expect(stringify(prevState.memoizedState)).toBe(stringify(nextState.memoizedState));
    const fiber = buildFiber({ prevState, nextState });
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(a => String(a)).join(" "));
    };
    try {
      walkFiberForUpdates(fiber, 0);
    } finally {
      console.log = origLog;
    }
    const joined = logs.join("\n");
  // Allow unknown or state0 label depending on resolution path
  // Multi-line format for 20-200 char values (starts with newline)
  expect(joined).toMatch(/State change (state0|unknown) \(identical value\):\s*\n\{"a":1,"b":2\}\n→\n\{"a":1,"b":2\}/);
  });

  it("should not flag different prop content changes", () => {
  traceOptions.detectIdenticalValueChanges = true;
  traceOptions.includeNonTrackedBranches = true;
  vi.spyOn(renderRegistry, "getTrackingGUID").mockReturnValue("identical-none-guid");
    const prevProps = { count: 1 };
    const nextProps = { count: 2 };
    const fiber = buildFiber({ prevProps, nextProps });
    const spy = vi.spyOn(logModule, "logIdenticalPropValueWarning");
    walkFiberForUpdates(fiber, 0);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
