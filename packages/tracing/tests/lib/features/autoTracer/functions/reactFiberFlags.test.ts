import { describe, expect, it } from "vitest";
import {
  // Flag constants
  Callback,
  ChildDeletion,
  ContentReset,
  DidCapture,
  type Flags,
  ForceClientRender,
  ForceUpdateForLegacySuspense,
  Hydrating,
  Incomplete,
  MountLayoutDev,
  MountPassiveDev,
  NoFlags,
  Passive,
  PerformedWork,
  Placement,
  PlacementDEV,
  Ref,
  ShouldCapture,
  Snapshot,
  StoreConsistency,
  Update,
  Visibility,
  // Utility functions
  getFlagNames,
  hasRenderWork,
  isLikelyMount,
} from "@src/lib/features/autoTracer/functions/reactFiberFlags.js";

describe("reactFiberFlags", () => {
  describe("getFlagNames", () => {
    it("should return empty array for NoFlags", () => {
      const result = getFlagNames(NoFlags);
      expect(result).toEqual([]);
    });

    it("should return single flag name for single flag", () => {
      const result = getFlagNames(PerformedWork);
      expect(result).toEqual(["PerformedWork"]);
    });

    it("should return multiple flag names for combined flags", () => {
      const combinedFlags = PerformedWork | Update | Placement;
      const result = getFlagNames(combinedFlags);

      expect(result).toContain("PerformedWork");
      expect(result).toContain("Update");
      expect(result).toContain("Placement");
      expect(result).toHaveLength(3);
    });

    it("should handle flags that are not in FLAG_NAMES", () => {
      expect(getFlagNames(Visibility)).toEqual([]);
      expect(getFlagNames(MountLayoutDev)).toEqual([]);
      expect(getFlagNames(MountPassiveDev)).toEqual([]);
      expect(getFlagNames(ForceUpdateForLegacySuspense)).toEqual([
        "ShouldCapture",
      ]);
    });

    it("should handle overlapping flags correctly", () => {
      // Test flags that share the same bit value
      expect(getFlagNames(Hydrating)).toEqual([]);
      expect(getFlagNames(Snapshot)).toEqual(["Hydrating/Snapshot"]);
      expect(getFlagNames(DidCapture)).toEqual([]);
    });

    it("should handle zero and negative values gracefully", () => {
      expect(getFlagNames(0)).toEqual([]);
      expect(getFlagNames(-1)).toEqual(expect.any(Array));
    });

    it("should handle complex flag combinations", () => {
      const complexFlags = PerformedWork | Update | Placement | Ref | Passive;
      const result = getFlagNames(complexFlags);

      expect(result).toContain("PerformedWork");
      expect(result).toContain("Update");
      expect(result).toContain("Placement");
      expect(result).toContain("Ref");
      expect(result).toContain("Passive");
      expect(result).toHaveLength(5);
    });

    it("should handle unknown flags gracefully", () => {
      // Test with a flag value that's not in FLAG_NAMES
      const unknownFlag = 0b1111111111111111111111111111111; // All bits set
      const result = getFlagNames(unknownFlag);

      // Should only return known flag names, not crash
      expect(Array.isArray(result)).toBe(true);
      result.forEach((name) => {
        expect(typeof name).toBe("string");
      });
    });
  });

  describe("hasRenderWork", () => {
    it("should return false for NoFlags", () => {
      expect(hasRenderWork(NoFlags)).toBe(false);
    });

    it("should return true for PerformedWork", () => {
      expect(hasRenderWork(PerformedWork)).toBe(true);
    });

    it("should return true for Update", () => {
      expect(hasRenderWork(Update)).toBe(true);
    });

    it("should return true for Placement", () => {
      expect(hasRenderWork(Placement)).toBe(true);
    });

    it("should return true for combinations including render work flags", () => {
      expect(hasRenderWork(PerformedWork | Ref)).toBe(true);
      expect(hasRenderWork(Update | Passive)).toBe(true);
      expect(hasRenderWork(Placement | ContentReset)).toBe(true);
      expect(hasRenderWork(PerformedWork | Update | Placement)).toBe(true);
    });

    it("should return false for flags without render work", () => {
      expect(hasRenderWork(Ref)).toBe(false);
      expect(hasRenderWork(Passive)).toBe(false);
      expect(hasRenderWork(ContentReset)).toBe(false);
      expect(hasRenderWork(ChildDeletion)).toBe(false);
      expect(hasRenderWork(Callback)).toBe(false);
      expect(hasRenderWork(Ref | Passive | ContentReset)).toBe(false);
    });

    it("should handle development and side effect flags", () => {
      expect(hasRenderWork(PlacementDEV)).toBe(false);
      expect(hasRenderWork(MountLayoutDev)).toBe(false);
      expect(hasRenderWork(Incomplete)).toBe(false);
      expect(hasRenderWork(ShouldCapture)).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(hasRenderWork(0)).toBe(false);
      expect(hasRenderWork(-1)).toBe(true); // Negative numbers have all bits set, including render work bits
    });
  });

  describe("isLikelyMount", () => {
    describe("with alternate (not a mount)", () => {
      it("should return false when hasAlternate is true, regardless of flags", () => {
        expect(isLikelyMount(NoFlags, true)).toBe(false);
        expect(isLikelyMount(Placement, true)).toBe(false);
        expect(isLikelyMount(PlacementDEV, true)).toBe(false);
        expect(isLikelyMount(MountLayoutDev, true)).toBe(false);
        expect(isLikelyMount(MountPassiveDev, true)).toBe(false);
        expect(
          isLikelyMount(Placement | PlacementDEV | MountLayoutDev, true)
        ).toBe(false);
      });
    });

    describe("without alternate (potential mount)", () => {
      it("should return false for NoFlags", () => {
        expect(isLikelyMount(NoFlags, false)).toBe(false);
      });

      it("should return true for Placement flag", () => {
        expect(isLikelyMount(Placement, false)).toBe(true);
      });

      it("should return true for PlacementDEV flag", () => {
        expect(isLikelyMount(PlacementDEV, false)).toBe(true);
      });

      it("should return true for MountLayoutDev flag", () => {
        expect(isLikelyMount(MountLayoutDev, false)).toBe(true);
      });

      it("should return true for MountPassiveDev flag", () => {
        expect(isLikelyMount(MountPassiveDev, false)).toBe(true);
      });

      it("should return true for combinations of mount flags", () => {
        expect(isLikelyMount(Placement | PlacementDEV, false)).toBe(true);
        expect(isLikelyMount(MountLayoutDev | MountPassiveDev, false)).toBe(
          true
        );
        expect(
          isLikelyMount(Placement | MountLayoutDev | MountPassiveDev, false)
        ).toBe(true);
      });

      it("should return false for non-mount flags", () => {
        expect(isLikelyMount(PerformedWork, false)).toBe(false);
        expect(isLikelyMount(Update, false)).toBe(false);
        expect(isLikelyMount(ChildDeletion, false)).toBe(false);
        expect(isLikelyMount(ContentReset, false)).toBe(false);
        expect(isLikelyMount(Callback, false)).toBe(false);
        expect(isLikelyMount(Ref, false)).toBe(false);
        expect(isLikelyMount(Passive, false)).toBe(false);
      });

      it("should return true when mount flags are combined with other flags", () => {
        expect(isLikelyMount(Placement | PerformedWork | Update, false)).toBe(
          true
        );
        expect(isLikelyMount(PlacementDEV | Ref | Passive, false)).toBe(true);
        expect(
          isLikelyMount(MountLayoutDev | ContentReset | ChildDeletion, false)
        ).toBe(true);
      });

      it("should handle edge cases", () => {
        expect(isLikelyMount(0, false)).toBe(false);
        expect(isLikelyMount(-1, false)).toBe(true); // Negative numbers have all bits set, including mount flags
      });
    });
  });

  describe("type definitions", () => {
    it("should export Flags type correctly", () => {
      const flags: Flags = PerformedWork | Update;
      expect(typeof flags).toBe("number");
    });

    it("should allow assignment of flag constants to Flags type", () => {
      const noFlags: Flags = NoFlags;
      const performedWork: Flags = PerformedWork;
      const combined: Flags = PerformedWork | Update | Placement;

      expect(typeof noFlags).toBe("number");
      expect(typeof performedWork).toBe("number");
      expect(typeof combined).toBe("number");
    });
  });

  describe("bit operations and flag combinations", () => {
    it("should correctly combine flags with bitwise OR", () => {
      const combined = PerformedWork | Update | Placement;
      expect(combined & PerformedWork).toBeTruthy();
      expect(combined & Update).toBeTruthy();
      expect(combined & Placement).toBeTruthy();
      expect(combined & Ref).toBeFalsy();
    });

    it("should correctly check flags with bitwise AND", () => {
      const flags = PerformedWork | Placement;
      expect(Boolean(flags & PerformedWork)).toBe(true);
      expect(Boolean(flags & Placement)).toBe(true);
      expect(Boolean(flags & Update)).toBe(false);
      expect(Boolean(flags & Ref)).toBe(false);
    });

    it("should handle all flags combination", () => {
      const allFlags =
        PerformedWork |
        Placement |
        Update |
        ChildDeletion |
        ContentReset |
        Callback |
        ForceClientRender |
        Ref |
        Snapshot |
        Passive |
        Visibility |
        StoreConsistency |
        PlacementDEV |
        MountLayoutDev |
        MountPassiveDev;

      const flagNames = getFlagNames(allFlags);
      expect(flagNames.length).toBeGreaterThan(10);
      expect(hasRenderWork(allFlags)).toBe(true);
      expect(isLikelyMount(allFlags, false)).toBe(true);
      expect(isLikelyMount(allFlags, true)).toBe(false);
    });
  });
});
