import { describe, it, expect } from "vitest";
import { findStatefulHookTargets } from "@src/lib/functions/hookMapping/findStatefulHookTargets.js";

describe("findStatefulHookTargets", () => {
  it("should return empty array when debugHookTypes is null", () => {
    const result = findStatefulHookTargets(null);
    expect(result).toEqual([]);
  });

  it("should return empty array when debugHookTypes is undefined", () => {
    const result = findStatefulHookTargets(undefined);
    expect(result).toEqual([]);
  });

  it("should return empty array when debugHookTypes is empty", () => {
    const result = findStatefulHookTargets([]);
    expect(result).toEqual([]);
  });

  it("should find useState at index 0", () => {
    const types = ["useState"];
    const result = findStatefulHookTargets(types);
    expect(result).toEqual([0]);
  });

  it("should find useReducer at index 0", () => {
    const types = ["useReducer"];
    const result = findStatefulHookTargets(types);
    expect(result).toEqual([0]);
  });

  it("should find useSyncExternalStore at index 0", () => {
    const types = ["useSyncExternalStore"];
    const result = findStatefulHookTargets(types);
    expect(result).toEqual([0]);
  });

  it("should skip non-stateful hooks", () => {
    const types = ["useRef", "useMemo", "useCallback", "useEffect"];
    const result = findStatefulHookTargets(types);
    expect(result).toEqual([]);
  });

  it("should find multiple stateful hooks at correct indices", () => {
    const types = [
      "useState",      // 0
      "useRef",        // 1
      "useMemo",       // 2
      "useSyncExternalStore",  // 3
      "useEffect",     // 4
      "useReducer",    // 5
    ];
    const result = findStatefulHookTargets(types);
    expect(result).toEqual([0, 3, 5]);
  });

  it("should match the TodoList fixture pattern", () => {
    // From the analyzeFiberDump test output
    const types = [
      "useState",              // 0 - stateful
      "useRef",                // 1
      "useMemo",               // 2
      "useContext",            // 3
      "useContext",            // 4
      "useRef",                // 5
      "useCallback",           // 6
      "useRef",                // 7
      "useMemo",               // 8
      "useSyncExternalStore",  // 9 - stateful
      "useEffect",             // 10
      "useDebugValue",         // 11
      "useDebugValue",         // 12
      "useContext",            // 13
      "useRef",                // 14
      "useCallback",           // 15
      "useRef",                // 16
      "useMemo",               // 17
      "useSyncExternalStore",  // 18 - stateful
    ];
    const result = findStatefulHookTargets(types);
    expect(result).toEqual([0, 9, 18]);
  });
});
