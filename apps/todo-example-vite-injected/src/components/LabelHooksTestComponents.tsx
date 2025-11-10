import { useState, useReducer } from "react";
import { useAutoTracer } from "@auto-tracer/react18";
// import { useSelector } from 'react-redux';
// import { useAppSelector } from '../hooks/redux';
import {
  useCustomHook,
  useCustomHook2WithCustomHookInside,
} from "../hooks/customHooks";
// import type { RootState } from '../store/store';

// Test component that uses all hook types for labelHooks testing
export function LabelHooksTestComponent() {
  const logger = useAutoTracer();

  // useState
  const [title, setTitle] = useState("test-title");
  logger.labelState(0, "title", title, "setTitle", setTitle);

  // useReducer
  const [count, dispatch] = useReducer((state: number, action: string) => {
    return action === "increment" ? state + 1 : state;
  }, 0);
  logger.labelState(1, "count", count, "dispatch", dispatch);

  // useSelector - Mock for now to avoid Redux issues
  const todos = ["mock-todo-1", "mock-todo-2"]; // useSelector((state: RootState) => state.todos?.todos || ['mock-todo-1', 'mock-todo-2']);

  // useAppSelector - Mock for now to avoid Redux issues
  const appTodos = ["app-todo-1"]; // useAppSelector((state) => state.todos?.todos || ['app-todo-1']);

  // useCustomHook
  const custom = useCustomHook("test-custom");
  logger.labelState(2, "custom", custom);

  // useCustomHook2WithCustomHookInside
  const nested = useCustomHook2WithCustomHookInside();
  logger.labelState(3, "nested", nested);

  return (
    <div data-testid="label-hooks-test">
      <h3>LabelHooks Test Component</h3>
      <p>Title: {title}</p>
      <p>Count: {count}</p>
      <p>Todos count: {todos.length}</p>
      <p>App todos count: {appTodos.length}</p>
      <p>Custom: {custom.value}</p>
      <p>Nested: {nested.value}</p>

      <button onClick={() => setTitle("updated-title")}>Update Title</button>
      <button onClick={() => dispatch("increment")}>Increment Count</button>
      <button onClick={() => custom.setValue("updated-custom")}>
        Update Custom
      </button>
      <button onClick={() => nested.setValue("updated-nested")}>
        Update Nested
      </button>
    </div>
  );
}

// Test component that uses all hook types for labelHooksPattern testing
export function LabelHooksPatternTestComponent() {
  const logger = useAutoTracer();

  // useState
  const [description, setDescription] = useState("pattern-test");
  logger.labelState(0, "description", description, "setDescription", setDescription);

  // useReducer
  const [counter, dispatchCounter] = useReducer(
    (state: number, action: string) => {
      return action === "add" ? state + 5 : state;
    },
    10
  );
  logger.labelState(1, "counter", counter, "dispatchCounter", dispatchCounter);

  // useSelector - Mock for now to avoid Redux issues
  const selectorResult = "all-filter"; // useSelector((state: RootState) => state.todos?.filter || 'all-filter');

  // useAppSelector - Mock for now to avoid Redux issues
  const appSelectorResult = "all-app-filter"; // useAppSelector((state) => state.todos?.filter || 'all-app-filter');

  // useCustomHook
  const customHookResult = useCustomHook("pattern-custom");
  logger.labelState(2, "customHookResult", customHookResult);

  // useCustomHook2WithCustomHookInside
  const nestedHookResult = useCustomHook2WithCustomHookInside();
  logger.labelState(3, "nestedHookResult", nestedHookResult);

  return (
    <div data-testid="label-hooks-pattern-test">
      <h3>LabelHooksPattern Test Component</h3>
      <p>Description: {description}</p>
      <p>Counter: {counter}</p>
      <p>Selector: {selectorResult}</p>
      <p>App Selector: {appSelectorResult}</p>
      <p>Custom Hook: {customHookResult.value}</p>
      <p>Nested Hook: {nestedHookResult.value}</p>

      <button onClick={() => setDescription("pattern-updated")}>
        Update Description
      </button>
      <button onClick={() => dispatchCounter("add")}>Add to Counter</button>
      <button onClick={() => customHookResult.setValue("pattern-updated")}>
        Update Custom Hook
      </button>
      <button onClick={() => nestedHookResult.setValue("nested-updated")}>
        Update Nested Hook
      </button>
    </div>
  );
}
