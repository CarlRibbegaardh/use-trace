import { describe, it } from "vitest";
import { parse } from "flatted";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Fixture Analysis - todoListFiberWithDispatch", () => {
  it("should analyze the fixture structure", () => {
    const fixtureData = fs.readFileSync(
      path.join(
        __dirname,
        "../../fixtures/todoListFiberWithDispatch.fixture.flatted"
      ),
      "utf8"
    );
    const fiber = parse(fixtureData);

    console.log("\n=== FIXTURE STRUCTURE ANALYSIS ===");
    console.log("Fiber tag:", fiber.tag);
    console.log("Has alternate:", !!fiber.alternate);
    console.log("Has flags:", fiber.flags);
    console.log("Has _debugHookTypes:", !!fiber._debugHookTypes);
    console.log("Has memoizedState:", !!fiber.memoizedState);
    console.log("Has elementType:", !!fiber.elementType);

    if (fiber.alternate) {
      console.log("\n=== ALTERNATE FIBER ===");
      console.log("Alternate has memoizedState:", !!fiber.alternate.memoizedState);
      console.log("Alternate has memoizedProps:", !!fiber.alternate.memoizedProps);

      // Check if memoizedState chains are different objects
      console.log("Current and alternate memoizedState are same object:",
        fiber.memoizedState === fiber.alternate.memoizedState);
    }

    // Walk hooks and check for differences
    console.log("\n=== HOOK CHAIN COMPARISON ===");
    let currentHook = fiber.memoizedState;
    let alternateHook = fiber.alternate?.memoizedState;
    let hookIndex = 0;
    let differencesFound = 0;

    while (currentHook && hookIndex < 50) {
      if (currentHook.queue) {
        const currentState = currentHook.memoizedState;
        const alternateState = alternateHook?.memoizedState;
        const isDifferent = currentState !== alternateState;

        if (isDifferent) {
          console.log(`Hook ${hookIndex} HAS DIFFERENCE:`);
          console.log(`  Current:`, JSON.stringify(currentState).substring(0, 50));
          console.log(`  Alternate:`, JSON.stringify(alternateState).substring(0, 50));
          differencesFound++;
        }
      }

      currentHook = currentHook.next;
      alternateHook = alternateHook?.next;
      hookIndex++;
    }

    console.log(`\nTotal hooks with queues and differences: ${differencesFound}`);
    console.log("=== END ANALYSIS ===\n");
  });
});
