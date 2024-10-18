import { expect, test } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTrace } from "./useTrace.js";

test("Ensure rendering stability", () => {
  const hook = renderHook(
    (scopeName) => {
      return useTrace(scopeName.x, scopeName.y);
    },
    {
      initialProps: { x: "a", y: { a: "a" } },
    }
  );

  const a = hook.result.current;

  hook.rerender({ x: "a", y: { a: "b" } });

  const b = hook.result.current;
  expect(a).toBe(b);

  hook.rerender({ x: "b", y: { a: "a" } });

  const c = hook.result.current;
  expect(a).not.toBe(c);
});
