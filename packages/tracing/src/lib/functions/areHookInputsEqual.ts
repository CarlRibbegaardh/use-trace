import { isRefObject } from "./isRefObject";
import type { DependencyList } from "react";

// https://github.com/discord/react-base-hooks/blob/master/src/areHookInputsEqual.ts
// https://github.com/facebook/react/blob/c2034716a5bff586ab68c41a14139a535cbd788e/packages/react-reconciler/src/ReactFiberHooks.js#L314
export function areHookInputsEqual(
  nextDeps: DependencyList,
  prevDeps: DependencyList
): {
  equal: boolean;
  diffIndex: number[];
} {
  if (nextDeps.length !== prevDeps.length) {
    return {
      equal: false,
      diffIndex: [-1]
    };
  }

  const diffIndex = [];
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    const next = nextDeps[i];
    const prev = prevDeps[i];

    if (Object.is(next, prev)) {
      continue;
    }

    if (isRefObject(next) && isRefObject(prev)) {
      if (Object.is(next.current, prev.current)) {
        continue;
      }
    }

    if (undefined === next && undefined === prev) {
      continue;
    }

    diffIndex[diffIndex.length] = i;
  }

  return {
    equal: 0 === diffIndex.length,
    diffIndex: diffIndex
  };
}
