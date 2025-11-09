import { describe, it } from "vitest";
import { parse, stringify } from "flatted";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Fiber Dump Analysis", () => {
  it("should analyze hook chain structure from fiber dump", () => {
    // Read and parse the flatted fiber structure from the fixture
    const fixtureData = fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "fixtures",
        "todoListFiberWithDispatch.fixture.flatted"
      ),
      "utf8"
    );

    // Parse flatted format - returns the TodoList fiber directly
    const fiber = parse(fixtureData);

    console.log("\n=== FIBER DUMP ANALYSIS ===");
    console.log("Fiber tag:", fiber.tag);
    console.log("Fiber type:", typeof fiber);
    console.log("\n=== TodoList Fiber ===");
    console.log("memoizedState:", fiber.memoizedState);
    console.log("_debugHookTypes:", fiber._debugHookTypes);

    // Start walking the hook chain
    const firstHook = fiber.memoizedState;
    console.log("\n=== Walking Hook Chain ===");
    console.log("First hook:", firstHook);

    let currentHook: any = firstHook;
    let hookNumber = 0;
    const hooksWithQueues: number[] = [];
    const hooksWithoutQueues: number[] = [];

    while (currentHook !== null && hookNumber < 20) {
      console.log(`\n--- Hook ${hookNumber} ---`);

      if (typeof currentHook === "object" && currentHook !== null) {
        const keys = Object.keys(currentHook);
        console.log("Properties:", keys.join(", "));

        // Check for queue
        const hasQueue = "queue" in currentHook && currentHook.queue !== null;
        console.log(hasQueue ? "  ✓ HAS QUEUE" : "  ✗ NO QUEUE");

        if (hasQueue) {
          hooksWithQueues.push(hookNumber);
          const queueObj = currentHook.queue;
          if (queueObj && typeof queueObj === "object") {
            const queueKeys = Object.keys(queueObj);
            console.log("  Queue properties:", queueKeys.join(", "));
            console.log("  Queue object:", queueObj);

            // Check for distinguishing properties
            if ("lastRenderedState" in queueObj) {
              console.log(
                "    → Has lastRenderedState:",
                JSON.stringify(queueObj.lastRenderedState).substring(0, 50)
              );
            }
            if ("dispatch" in queueObj) {
              console.log("    → Has dispatch function");
            }
            if ("value" in queueObj) {
              console.log("    → Has value property (useSyncExternalStore)");
            }
          }
        } else {
          hooksWithoutQueues.push(hookNumber);
        }

        // Check memoizedState
        if ("memoizedState" in currentHook) {
          const stateValue = currentHook.memoizedState;
          try {
            const preview = JSON.stringify(stateValue).substring(0, 80);
            console.log("  memoizedState:", preview);
          } catch {
            console.log("  memoizedState: [circular or complex]");
          }
        }

        // Check baseState
        if ("baseState" in currentHook) {
          const baseStatePreview = JSON.stringify(
            currentHook.baseState
          ).substring(0, 50);
          console.log("  baseState:", baseStatePreview);
        }

        // Check for other distinguishing properties
        if ("tag" in currentHook) {
          console.log("  tag:", currentHook.tag);
        }

        // Move to next hook
        if ("next" in currentHook && currentHook.next !== null) {
          currentHook = currentHook.next;
        } else {
          console.log("  (end of chain)");
          currentHook = null;
        }
      } else {
        console.log("Not a hook object:", JSON.stringify(currentHook));
        break;
      }

      hookNumber++;
    }

    // Build table data for hooks with queues
    const labels = ["dispatch", "filteredTodos", "loading", "error", "filter"];
    const tableData: Array<{
      hookIndex: number;
      debugHookTypesIndex: number;
      stateName: string;
      guessedLabel: string;
      hookType: string;
      memoizedState: string;
      debugInfo: string;
    }> = [];

    // Reset to walk again and collect data for table
    // We need to track BOTH the hook chain position AND the _debugHookTypes position
    currentHook = firstHook;
    let hookChainIndex = 0; // Position in the linked list (0, 1, 2, 3, ...)
    let debugHookTypesIndex = 0; // Position in _debugHookTypes array
    let extractedIndex = 0; // Position in extracted hooks (only those with queues)

    while (currentHook !== null && hookChainIndex < 50) {
      if (typeof currentHook === "object" && currentHook !== null) {
        const hasQueue = "queue" in currentHook && currentHook.queue !== null;

        if (hasQueue) {
          // Get hook type from debugHookTypes using the FULL chain index
          const hookType =
            fiber._debugHookTypes?.[debugHookTypesIndex] || "unknown";

          // Get state name (how extractUseStateValues names it)
          const stateName = `state${hookChainIndex}`;

          // Current buggy logic: uses array position
          const guessedLabel = labels[extractedIndex] || "no-label";

          // Get memoizedState value
          let stateValueStr = "undefined";
          if ("memoizedState" in currentHook) {
            try {
              stateValueStr = JSON.stringify(
                currentHook.memoizedState
              ).substring(0, 50);
            } catch {
              stateValueStr = "[circular]";
            }
          }

          // Check for source location in fiber
          let debugInfo = "";
          if (fiber._debugSource) {
            debugInfo = `line ${fiber._debugSource.lineNumber || "?"}`;
          }

          tableData.push({
            hookIndex: hookChainIndex,
            debugHookTypesIndex,
            stateName,
            guessedLabel,
            hookType,
            memoizedState: stateValueStr,
            debugInfo,
          });

          extractedIndex++;
        }

        if ("next" in currentHook && currentHook.next !== null) {
          currentHook = currentHook.next;
          hookChainIndex++;
          debugHookTypesIndex++;
        } else {
          currentHook = null;
        }
      } else {
        break;
      }
    }

    console.log("\n=== HOOKS WITH QUEUES TABLE ===");
    console.log(
      "┌─────────┬──────────┬───────────┬─────────────────┬────────────────────────┬──────────────────────────────────────────────────┬────────────┐"
    );
    console.log(
      "│ Hook #  │ Type Idx │ State     │ Guessed Label   │ Hook Type              │ Memoized State                                   │ Debug Info │"
    );
    console.log(
      "├─────────┼──────────┼───────────┼─────────────────┼────────────────────────┼──────────────────────────────────────────────────┼────────────┤"
    );

    tableData.forEach((row) => {
      const hookIdx = row.hookIndex.toString().padEnd(7);
      const typeIdx = row.debugHookTypesIndex.toString().padEnd(8);
      const stateName = row.stateName.padEnd(9);
      const label = row.guessedLabel.padEnd(15);
      const hookType = row.hookType.padEnd(22);
      const state = row.memoizedState.padEnd(48);
      const debug = row.debugInfo.padEnd(10);
      console.log(
        `│ ${hookIdx} │ ${typeIdx} │ ${stateName} │ ${label} │ ${hookType} │ ${state} │ ${debug} │`
      );
    });

    console.log(
      "└─────────┴──────────┴───────────┴─────────────────┴────────────────────────┴──────────────────────────────────────────────────┴────────────┘"
    );

    // --- New Table 1: All Hooks in the Chain ---
    const hookChainTableData: Array<{
      hookIndex: number;
      hasQueue: string;
      memoizedState: string;
      allofit: string;
    }> = [];

    currentHook = firstHook;
    hookChainIndex = 0;
    while (currentHook !== null && hookChainIndex < 50) {
      if (typeof currentHook === "object" && currentHook !== null) {
        const hasQueue =
          "queue" in currentHook && currentHook.queue !== null ? "✓" : "✗";
        let stateValueStr = "N/A";
        if ("memoizedState" in currentHook) {
          try {
            stateValueStr = stringify(currentHook.memoizedState).substring(
              0,
              50
            );
          } catch {
            stateValueStr = "[circular]";
          }
        }

        const allofit = stringify(currentHook);

        hookChainTableData.push({
          hookIndex: hookChainIndex,
          hasQueue,
          memoizedState: stateValueStr,
          allofit: allofit,
        });

        if ("next" in currentHook && currentHook.next !== null) {
          currentHook = currentHook.next;
          hookChainIndex++;
        } else {
          currentHook = null;
        }
      } else {
        break;
      }
    }

    console.log("\n\n=== HOOK CHAIN (ALL ITEMS) ===");
    console.log(
      "┌─────────┬────────────┬────────────────────────────────────────────────────┐"
    );
    console.log(
      "│ Hook #  │ Has Queue? │ Memoized State                                     │"
    );
    console.log(
      "├─────────┼────────────┼────────────────────────────────────────────────────┤"
    );
    hookChainTableData.forEach((row) => {
      const hookIdx = row.hookIndex.toString().padEnd(7);
      const queueStatus = row.hasQueue.padEnd(10);
      const state = row.memoizedState.padEnd(50);
      console.log(
        `│ ${hookIdx} │ ${queueStatus} │ ${state} │ ${/*row.allofit*/ ""}`
      );
    });
    console.log(
      "└─────────┴────────────┴────────────────────────────────────────────────────┘"
    );


    // --- New Table 2: All Hook Types from _debugHookTypes ---
    const assignGroupIds = (hooks: string[]): Array<{ index: number; hookType: string; groupId: number }> => {
      const result: Array<{ index: number; hookType: string; groupId: number }> = [];
      let groupId = 0;
      let i = 0;

      // Pattern for useAppSelector (approximated)
      const useAppSelectorPattern = [
        "useContext", "useRef", "useCallback", "useRef", "useMemo",
        "useSyncExternalStore", "useEffect", "useDebugValue", "useDebugValue"
      ];

      while (i < hooks.length) {
        const remainingHooks = hooks.slice(i);

        // Check for useAppSelector pattern
        let isPatternMatch = true;
        if (remainingHooks.length >= useAppSelectorPattern.length) {
          for (let j = 0; j < useAppSelectorPattern.length; j++) {
            if (remainingHooks[j] !== useAppSelectorPattern[j]) {
              isPatternMatch = false;
              break;
            }
          }
        } else {
          isPatternMatch = false;
        }

        if (isPatternMatch) {
          // This is a useAppSelector block
          for (let j = 0; j < useAppSelectorPattern.length; j++) {
            const hookType = hooks[i];
            if (hookType) {
              result.push({ index: i, hookType, groupId });
            }
            i++;
          }
          groupId++;
        } else {
          // Handle single hooks or other patterns
          const hookType = hooks[i];
          if (hookType) {
            result.push({ index: i, hookType, groupId });
          }
          i++;
          groupId++;
        }
      }
      return result;
    };

    const debugTypesTableData = assignGroupIds(fiber._debugHookTypes || []);

    console.log("\n\n=== _debugHookTypes ARRAY (Grouped) ===");
    console.log("┌─────────┬────────────────────────┬─────────┐");
    console.log("│ Index   │ Hook Type              │ Group # │");
    console.log("├─────────┼────────────────────────┼─────────┤");
    debugTypesTableData.forEach(row => {
      const index = row.index.toString().padEnd(7);
      const hookType = row.hookType.padEnd(22);
      const group = row.groupId.toString().padEnd(7);
      console.log(`│ ${index} │ ${hookType} │ ${group} │`);
    });
    console.log("└─────────┴────────────────────────┴─────────┘");

    // --- Final Combined Table ---
    const statefulHookTypes = (fiber._debugHookTypes || [])
      .map((type: string, index: number) => ({ type, index }))
      .filter((hook: { type: string; index: number }) => hook.type === 'useState' || hook.type === 'useSyncExternalStore');

    const anchorsWithQueues: Array<{ index: number; state: any }> = [];
    currentHook = firstHook;
    hookChainIndex = 0;
    while (currentHook !== null && hookChainIndex < 50) {
      if (typeof currentHook === "object" && currentHook !== null) {
        if ("queue" in currentHook && currentHook.queue !== null) {
          anchorsWithQueues.push({
            index: hookChainIndex,
            state: currentHook.memoizedState,
          });
        }
        if ("next" in currentHook && currentHook.next !== null) {
          currentHook = currentHook.next;
          hookChainIndex++;
        } else {
          currentHook = null;
        }
      } else {
        break;
      }
    }

    const combinedTableData = anchorsWithQueues.map((anchor, i) => {
      const target = statefulHookTypes[i];
      const label = labels[i] || "no-label"; // This is what the build-time label should be
      let stateValueStr = "N/A";
      try {
        stateValueStr = JSON.stringify(anchor.state).substring(0, 50);
      } catch {
        stateValueStr = "[circular]";
      }

      return {
        anchorIndex: anchor.index,
        targetIndex: target?.index ?? "N/A",
        hookType: target?.type ?? "N/A",
        label,
        state: stateValueStr,
      };
    });

    console.log("\n\n=== COMBINED MAPPING TABLE ===");
    console.log("┌────────────┬────────────┬────────────────────────┬─────────────────┬────────────────────────────────────────────────────┐");
    console.log("│ Anchor Idx │ Target Idx │ Hook Type (from Target)│ Correct Label   │ Memoized State (from Anchor)                       │");
    console.log("├────────────┼────────────┼────────────────────────┼─────────────────┼────────────────────────────────────────────────────┤");
    combinedTableData.forEach(row => {
      const anchorIdx = row.anchorIndex.toString().padEnd(10);
      const targetIdx = row.targetIndex.toString().padEnd(10);
      const hookType = row.hookType.padEnd(22);
      const label = row.label.padEnd(15);
      const state = row.state.padEnd(50);
      console.log(`│ ${anchorIdx} │ ${targetIdx} │ ${hookType} │ ${label} │ ${state} │`);
    });
    console.log("└────────────┴────────────┴────────────────────────┴─────────────────┴────────────────────────────────────────────────────┘");
  });
});
