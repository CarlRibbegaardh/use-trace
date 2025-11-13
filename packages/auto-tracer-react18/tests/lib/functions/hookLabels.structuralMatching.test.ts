import { describe, it, expect, beforeEach } from "vitest";
import {
  addLabelForGuid,
  clearAllHookLabels,
  resolveHookLabel,
} from "@src/lib/functions/hookLabels.js";

/**
 * STRUCTURAL MATCHING TEST SUITE
 *
 * These tests validate the core functionality that normalizeValue() was designed for:
 * matching custom hooks that return objects with the same structure but different values.
 *
 * Key scenarios:
 * 1. Custom hooks returning objects with changing values (e.g., form state)
 * 2. Functions that may or may not be memoized (different instances on re-render)
 * 3. Structural matching when object shape stays the same but values change
 * 4. Multiple hooks with similar structures (ordinal disambiguation)
 *
 * These tests MUST continue to pass after fixing the display bug.
 */
describe("hookLabels - structural matching for custom hooks", () => {
  beforeEach(() => {
    clearAllHookLabels();
  });

  describe("basic structural matching", () => {
    it("should match custom hook by structure when values change", () => {
      const guid = "form-component";

      // First render: form state with initial value
      const setValue1 = (v: string) => console.log("set", v);
      const validate1 = (v: string) => v.length > 0;

      const formState1 = {
        value: "John",
        setValue: setValue1,
        validate: validate1,
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "formState",
        value: formState1,
      });

      // Simulate second render: value changes, functions recreated (not memoized)
      const setValue2 = (v: string) => console.log("set", v); // Different instance!
      const validate2 = (v: string) => v.length > 0; // Different instance!

      const formState2 = {
        value: "Jane", // VALUE CHANGED
        setValue: setValue2, // NEW FUNCTION INSTANCE
        validate: validate2, // NEW FUNCTION INSTANCE
      };

      // Mock fiber anchors - formState is the only hook
      const allFiberAnchors = [{ index: 0, value: formState2 }];

      // Should still resolve to "formState" because structure matches
      const resolved = resolveHookLabel(guid, 0, formState2, allFiberAnchors);

      expect(resolved).toBe("formState");
    });

    it("should match custom hook even when function references change", () => {
      const guid = "counter-component";

      // First render
      const increment1 = () => console.log("inc");
      const decrement1 = () => console.log("dec");

      const counterState1 = {
        count: 0,
        increment: increment1,
        decrement: decrement1,
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "counter",
        value: counterState1,
      });

      // Second render: count changes, functions recreated
      const increment2 = () => console.log("inc");
      const decrement2 = () => console.log("dec");

      const counterState2 = {
        count: 5,
        increment: increment2,
        decrement: decrement2,
      };

      const allFiberAnchors = [{ index: 0, value: counterState2 }];
      const resolved = resolveHookLabel(
        guid,
        0,
        counterState2,
        allFiberAnchors
      );

      expect(resolved).toBe("counter");
    });

    it("should NOT match when structure changes (different keys)", () => {
      const guid = "dynamic-component";

      // First render: object with 2 properties
      const state1 = {
        value: "test",
        setValue: () => {},
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "simpleState",
        value: state1,
      });

      // Second render: object with 3 properties (structure changed!)
      const state2 = {
        value: "test",
        setValue: () => {},
        reset: () => {}, // NEW PROPERTY
      };

      const allFiberAnchors = [{ index: 0, value: state2 }];
      const resolved = resolveHookLabel(guid, 0, state2, allFiberAnchors);

      // Should NOT match - structure is different
      expect(resolved).toBe("unknown");
    });

    it("should NOT match when key order changes", () => {
      const guid = "ordered-component";

      // First render: keys in order [value, setValue]
      const state1 = {
        value: "test",
        setValue: () => {},
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "orderedState",
        value: state1,
      });

      // Second render: same keys but different order [setValue, value]
      // Note: In JavaScript, insertion order matters for objects
      const state2 = {
        setValue: () => {},
        value: "test",
      };

      const allFiberAnchors = [{ index: 0, value: state2 }];
      const resolved = resolveHookLabel(guid, 0, state2, allFiberAnchors);

      // Should NOT match - key order is different
      expect(resolved).toBe("unknown");
    });
  });

  describe("complex custom hooks", () => {
    it("should match form hook with nested structure", () => {
      const guid = "form-component";

      // First render: complex form state
      const form1 = {
        values: { email: "test@example.com", name: "John" },
        errors: {},
        touched: { email: false },
        handleSubmit: () => {},
        handleChange: () => {},
        setFieldValue: () => {},
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "form",
        value: form1,
      });

      // Second render: user types, errors appear
      const form2 = {
        values: { email: "invalid-email", name: "John" },
        errors: { email: "Invalid email format" },
        touched: { email: true },
        handleSubmit: () => {},
        handleChange: () => {},
        setFieldValue: () => {},
      };

      const allFiberAnchors = [{ index: 0, value: form2 }];
      const resolved = resolveHookLabel(guid, 0, form2, allFiberAnchors);

      expect(resolved).toBe("form");
    });

    it("should match async query hook with changing status", () => {
      const guid = "data-component";

      // First render: loading
      const query1 = {
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: () => {},
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "userQuery",
        value: query1,
      });

      // Second render: loaded with data
      const query2 = {
        data: { id: 1, name: "Alice" },
        isLoading: false,
        isError: false,
        error: null,
        refetch: () => {},
      };

      const allFiberAnchors = [{ index: 0, value: query2 }];
      const resolved = resolveHookLabel(guid, 0, query2, allFiberAnchors);

      expect(resolved).toBe("userQuery");
    });
  });

  describe("multiple hooks with ordinal disambiguation", () => {
    it("should distinguish multiple form hooks by ordinal position", () => {
      const guid = "multi-form-component";

      // Two form hooks with identical structure
      const emailForm = {
        value: "test@example.com",
        setValue: () => {},
        error: null,
      };

      const passwordForm = {
        value: "password123",
        setValue: () => {},
        error: null,
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "emailForm",
        value: emailForm,
      });

      addLabelForGuid(guid, {
        index: 1,
        label: "passwordForm",
        value: passwordForm,
      });

      // Second render: both values change
      const emailForm2 = {
        value: "new@example.com",
        setValue: () => {},
        error: null,
      };

      const passwordForm2 = {
        value: "newpassword",
        setValue: () => {},
        error: null,
      };

      const allFiberAnchors = [
        { index: 0, value: emailForm2 },
        { index: 1, value: passwordForm2 },
      ];

      // Should resolve based on ordinal position
      const resolved1 = resolveHookLabel(guid, 0, emailForm2, allFiberAnchors);
      const resolved2 = resolveHookLabel(
        guid,
        1,
        passwordForm2,
        allFiberAnchors
      );

      expect(resolved1).toBe("emailForm");
      expect(resolved2).toBe("passwordForm");
    });

    it("should handle three hooks with same structure using ordinal", () => {
      const guid = "triple-state-component";

      // Three hooks with identical structure
      const state1 = { value: "a", setValue: () => {} };
      const state2 = { value: "b", setValue: () => {} };
      const state3 = { value: "c", setValue: () => {} };

      addLabelForGuid(guid, { index: 0, label: "state1", value: state1 });
      addLabelForGuid(guid, { index: 1, label: "state2", value: state2 });
      addLabelForGuid(guid, { index: 2, label: "state3", value: state3 });

      // All values change
      const newState1 = { value: "x", setValue: () => {} };
      const newState2 = { value: "y", setValue: () => {} };
      const newState3 = { value: "z", setValue: () => {} };

      const allFiberAnchors = [
        { index: 0, value: newState1 },
        { index: 1, value: newState2 },
        { index: 2, value: newState3 },
      ];

      expect(resolveHookLabel(guid, 0, newState1, allFiberAnchors)).toBe(
        "state1"
      );
      expect(resolveHookLabel(guid, 1, newState2, allFiberAnchors)).toBe(
        "state2"
      );
      expect(resolveHookLabel(guid, 2, newState3, allFiberAnchors)).toBe(
        "state3"
      );
    });
  });

  describe("mixed primitive and object hooks", () => {
    it("should match object hook by structure even when surrounded by primitives with different values", () => {
      const guid = "mixed-component";

      // Mix of primitive and object hooks
      // Note: Primitives with different values won't match by value,
      // but objects with same structure should match
      addLabelForGuid(guid, { index: 0, label: "count", value: 0 });
      addLabelForGuid(guid, {
        index: 1,
        label: "form",
        value: { value: "test", setValue: () => {} },
      });
      addLabelForGuid(guid, { index: 2, label: "isOpen", value: false });

      // Second render: primitives change value, object changes content but keeps structure
      const newForm = { value: "changed", setValue: () => {} };
      const allFiberAnchors = [
        { index: 0, value: 5 }, // Different value from 0
        { index: 1, value: newForm }, // Same structure as stored form
        { index: 2, value: true }, // Different value from false
      ];

      // Primitives with different values should return "unknown" (no value match, no structural match)
      expect(resolveHookLabel(guid, 0, 5, allFiberAnchors)).toBe("unknown");

      // Object with same structure should match
      expect(resolveHookLabel(guid, 1, newForm, allFiberAnchors)).toBe("form");

      // Primitive with different value should return "unknown"
      expect(resolveHookLabel(guid, 2, true, allFiberAnchors)).toBe("unknown");
    });
  });

  describe("edge cases", () => {
    it("should handle empty objects", () => {
      const guid = "empty-component";

      addLabelForGuid(guid, {
        index: 0,
        label: "emptyState",
        value: {},
      });

      const allFiberAnchors = [{ index: 0, value: {} }];
      const resolved = resolveHookLabel(guid, 0, {}, allFiberAnchors);

      expect(resolved).toBe("emptyState");
    });

    it("should handle objects with only functions", () => {
      const guid = "actions-component";

      const actions1 = {
        increment: () => {},
        decrement: () => {},
        reset: () => {},
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "actions",
        value: actions1,
      });

      // All functions recreated
      const actions2 = {
        increment: () => {},
        decrement: () => {},
        reset: () => {},
      };

      const allFiberAnchors = [{ index: 0, value: actions2 }];
      const resolved = resolveHookLabel(guid, 0, actions2, allFiberAnchors);

      expect(resolved).toBe("actions");
    });

    it("should handle arrays as values (treated as opaque)", () => {
      const guid = "list-component";

      const state1 = {
        items: [1, 2, 3],
        addItem: () => {},
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "listState",
        value: state1,
      });

      const state2 = {
        items: [1, 2, 3, 4], // Array changed
        addItem: () => {},
      };

      const allFiberAnchors = [{ index: 0, value: state2 }];
      const resolved = resolveHookLabel(guid, 0, state2, allFiberAnchors);

      // Should match because structure (keys) is the same
      expect(resolved).toBe("listState");
    });

    it("should handle null and undefined values", () => {
      const guid = "nullable-component";

      const state1 = {
        data: null,
        error: undefined,
        load: () => {},
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "asyncState",
        value: state1,
      });

      const state2 = {
        data: { id: 1 },
        error: undefined,
        load: () => {},
      };

      const allFiberAnchors = [{ index: 0, value: state2 }];
      const resolved = resolveHookLabel(guid, 0, state2, allFiberAnchors);

      expect(resolved).toBe("asyncState");
    });
  });

  describe("real-world patterns", () => {
    it("should match useTrace hook object", () => {
      const guid = "traced-component";

      // useTrace returns: {exit: fn, log: fn, state: fn}
      const trace1 = {
        exit: () => {},
        log: () => {},
        state: () => {},
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "trace",
        value: trace1,
      });

      // Functions are recreated (useTrace internals change)
      const trace2 = {
        exit: () => {},
        log: () => {},
        state: () => {},
      };

      const allFiberAnchors = [{ index: 0, value: trace2 }];
      const resolved = resolveHookLabel(guid, 0, trace2, allFiberAnchors);

      expect(resolved).toBe("trace");
    });

    it("should match react-hook-form control object", () => {
      const guid = "form-component";

      const control1 = {
        register: () => {},
        handleSubmit: () => {},
        formState: { errors: {}, isDirty: false },
        watch: () => {},
        setValue: () => {},
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "control",
        value: control1,
      });

      const control2 = {
        register: () => {},
        handleSubmit: () => {},
        formState: { errors: { email: "Required" }, isDirty: true },
        watch: () => {},
        setValue: () => {},
      };

      const allFiberAnchors = [{ index: 0, value: control2 }];
      const resolved = resolveHookLabel(guid, 0, control2, allFiberAnchors);

      expect(resolved).toBe("control");
    });

    it("should match intl object from useIntl", () => {
      const guid = "i18n-component";

      const intl1 = {
        formatMessage: () => {},
        formatDate: () => {},
        formatNumber: () => {},
        locale: "en-US",
      };

      addLabelForGuid(guid, {
        index: 0,
        label: "intl",
        value: intl1,
      });

      const intl2 = {
        formatMessage: () => {},
        formatDate: () => {},
        formatNumber: () => {},
        locale: "sv-SE", // Locale changed
      };

      const allFiberAnchors = [{ index: 0, value: intl2 }];
      const resolved = resolveHookLabel(guid, 0, intl2, allFiberAnchors);

      expect(resolved).toBe("intl");
    });
  });
});
