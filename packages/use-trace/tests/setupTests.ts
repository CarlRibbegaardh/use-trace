import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Clean up DOM between tests to prevent test pollution
afterEach(() => {
  cleanup();
});
