import React from "react";

/**
 * Component representing an empty node in the tree.
 * Empty nodes have:
 * - No state changes
 * - No prop changes (only children which is skipped)
 * - No component logs
 * - Not tracked (no useAutoTracer)
 * - No identical value warnings
 */
export interface EmptyWrapperProps {
  children: React.ReactNode;
}

/**
 * A simple wrapper component with no tracking and no meaningful props.
 * Used to create "empty" nodes in the render tree that will be filtered.
 * Only accepts children (which is skipped by autoTracer).
 */
export const EmptyWrapper: React.FC<EmptyWrapperProps> = ({ children }) => {
  return <div>{children}</div>;
};
