import { describe, it, expect } from "vitest";
import { transform } from "../../src/functions/transform/transform";
import type { TransformContext } from "../../src/interfaces/TransformContext";

/**
 * Test case to reproduce the label misalignment bug when both labelHooks and labelHooksPattern are enabled
 * and a component uses useAppDispatch + useAppSelector hooks.
 *
 * The bug manifests as:
 * - dispatch getting the label/value from filteredTodos
 * - filteredTodos getting the label/value from loading
 * - etc.
 */
describe("dispatch + selector label alignment bug", () => {
  it("should correctly label dispatch and selector hooks without misalignment", () => {
    const code = `
      function TodoList() {
        const dispatch = useAppDispatch();
        const filteredTodos = useAppSelector(selectFilteredTodos);
        const loading = useAppSelector(selectTodosLoading);
        const error = useAppSelector(selectTodosError);
        const filter = useAppSelector(selectTodosFilter);
        return <div>{filteredTodos.length}</div>;
      }
    `;

    const context: TransformContext = {
      filename: "src/TodoList.tsx",
      config: {
        mode: "opt-out",
        importSource: "@auto-tracer/react18",
        include: ["src/**/*.tsx"],
        exclude: ["**/*.test.*", "**/*.spec.*"],
        // Both mechanisms enabled - this triggers the bug
        labelHooks: [
          "useState",
          "useReducer",
          "useSelector",
          "useAppSelector",
          "useCustomHook",
          "useCustomHook2WithCustomHookInside",
        ],
        labelHooksPattern: "^use[A-Z].*",
      },
    };

    const result = transform(code, context);
    expect(result.injected).toBe(true);

    // Expected behavior:
    // Index 0: dispatch (from useAppDispatch)
    // Index 1: filteredTodos (from useAppSelector)
    // Index 2: loading (from useAppSelector)
    // Index 3: error (from useAppSelector)
    // Index 4: filter (from useAppSelector)

    // Check that dispatch is labeled with index 0 and includes the value
    expect(result.code).toMatch(
      /labelState\(['"]dispatch['"],\s*0,\s*dispatch\)/
    );

    // Check that filteredTodos is labeled with index 1 and includes the value
    expect(result.code).toMatch(
      /labelState\(['"]filteredTodos['"],\s*1,\s*filteredTodos\)/
    );

    // Check that loading is labeled with index 2 and includes the value
    expect(result.code).toMatch(
      /labelState\(['"]loading['"],\s*2,\s*loading\)/
    );

    // Check that error is labeled with index 3 and includes the value
    expect(result.code).toMatch(/labelState\(['"]error['"],\s*3,\s*error\)/);

    // Check that filter is labeled with index 4 and includes the value
    expect(result.code).toMatch(/labelState\(['"]filter['"],\s*4,\s*filter\)/);

    console.log("Transformed code:");
    console.log(result.code);
  });
});
