import { useState } from "react";

// useCustomHook - simple custom hook with useState
export function useCustomHook(initialValue: string = "custom-initial") {
  const [value, setValue] = useState(initialValue);
  return { value, setValue };
}

// useCustomHook2WithCustomHookInside - nested custom hook that uses another custom hook
export function useCustomHook2WithCustomHookInside() {
  const inner = useCustomHook("nested-custom");

  return {
    value: inner.value,
    setValue: inner.setValue,
  };
}
