import { useMemo } from "react";
import { traceEnter, traceExit, traceLogFn } from "../functions/index.js";
import { useObjectChangeTracker } from "./useObjectChangeTracker.js";
import type { IUseTrace } from "../interfaces/IUseTrace.js";

const noop = (): void => {
  // Empty
};

export function useTrace(
  scopeName: string,
  scopeObject?: object,
  enabled?: boolean
): IUseTrace {
  const active = enabled !== false;

  const propTracker = useObjectChangeTracker(scopeName, "prop");
  const stateTracker = useObjectChangeTracker(scopeName, "state");

  if (active) {
    traceEnter(scopeName);
    propTracker.compare(scopeObject);
  }

  const result = useMemo<IUseTrace>(() => {
    if (active) {
      return {
        exit: traceExit(scopeName),
        log: traceLogFn(scopeName),
        state: stateTracker.compare,
      };
    } else {
      return {
        state: noop,
        log: noop,
        exit: noop,
      };
    }
  }, [active, scopeName, stateTracker.compare]);

  return result;
}
