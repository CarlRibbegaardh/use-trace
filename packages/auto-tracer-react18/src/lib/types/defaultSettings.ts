import type { AutoTracerOptions } from "../interfaces/AutoTracerOptions.js";

/**
 * Default configuration for autoTracer
 * This is the single source of truth for all default settings
 */
export const defaultAutoTracerOptions: AutoTracerOptions = {
  enabled: true, // Enable the autoTracer by default
  includeReconciled: false,
  includeSkipped: false,
  showFlags: false,
  enableAutoTracerInternalsLogging: false,
  maxFiberDepth: 100, // Maximum fiber traversal depth to prevent stack overflow
  includeNonTrackedBranches: false, // Only show tracked components and their parent chain by default
  skippedObjectProps: [], // Skip specific props for specific object types
  // Simple boolean per spec: enabled by default
  detectIdenticalValueChanges: true,
  filterEmptyNodes: "none", // No empty node filtering by default (backward compatible)

  // Default styling (matching comments in AutoTracerOptions.ts)
  colors: {
    definitiveRender: {
      lightMode: { text: "#0044ff", bold: true }, // Blue, Bold
      darkMode: { text: "#4fd6ff", bold: true }, // Lighter blue
      icon: "⚡",
    },
    propInitial: {
      icon: undefined, // Initial prop value
      lightMode: { text: "#c900bf", italic: true }, // Magenta, Italic
      darkMode: { text: "#ff77e8", italic: true }, // Lighter magenta for dark mode
    },
    propChange: {
      icon: undefined, // Prop changed
      lightMode: { text: "#c900bf" }, // Magenta
      darkMode: { text: "#ff77e8" }, // Lighter magenta for dark mode
    },
    stateInitial: {
      icon: undefined, // Initial state value
      lightMode: { text: "#df7f02", italic: true }, // Orange, Italic
      darkMode: { text: "#ffcf33", italic: true }, // Lighter orange for dark mode
    },
    stateChange: {
      icon: undefined, // State changed
      lightMode: { text: "#df7f02" }, // Orange
      darkMode: { text: "#ffcf33" }, // Lighter orange for dark mode
    },
    logStatements: {
      icon: undefined, // Log statements
      lightMode: { text: "#00aa00" }, // Green
      darkMode: { text: "#4ade80" }, // Lighter green for dark mode
    },
    reconciled: {
      lightMode: { text: "#9ca3af" }, // Gray-500
      darkMode: { text: "#9ca3af" }, // Gray-500
      icon: undefined, // Reconciled/reused
    },
    skipped: {
      lightMode: { text: "#8e8e8e" }, // Gray-500
      darkMode: { text: "#9ca3af" }, // Gray-500
      icon: undefined, // Skipped
    },
    // Distinct identical state value warning styling (icon only; inherit rest)
    identicalStateValueWarning: {
      icon: "⚠️", // Warning icon
      lightMode: { bold: true }, // Rely on existing stateChange color layering (no hue override)
      darkMode: { bold: true },
    },
    // Distinct identical prop value warning styling (icon only; inherit rest)
    identicalPropValueWarning: {
      icon: "⚠️", // Warning icon
      lightMode: { bold: true }, // Rely on existing propChange color layering (no hue override)
      darkMode: { bold: true },
    },
    other: {
      lightMode: { text: "#000000" }, // Black
      darkMode: { text: "#ffffff" }, // White
      icon: undefined, // Other/unknown
    },
  },
};
