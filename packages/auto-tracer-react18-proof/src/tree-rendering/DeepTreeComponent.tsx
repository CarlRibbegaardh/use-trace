import React from "react";
import { EmptyWrapper } from "./EmptyWrapper";
import { TrackedComponent } from "./TrackedComponent";

/**
 * Component demonstrating a deep tree structure with multiple empty wrapper levels.
 * Used to test filter modes: none, first, all.
 *
 * Structure:
 * - DeepTreeComponent (empty, no tracking)
 *   - EmptyWrapper (empty)
 *     - EmptyWrapper (empty)
 *       - EmptyWrapper (empty)
 *         - EmptyWrapper (empty)
 *           - EmptyWrapper (empty)
 *             - TrackedComponent (non-empty, has state)
 *               - EmptyWrapper (empty)
 *                 - EmptyWrapper (empty)
 *                   - TrackedComponent (non-empty, has state)
 */
export const DeepTreeComponent: React.FC = () => {
  return (
    <EmptyWrapper>
      <EmptyWrapper>
        <EmptyWrapper>
          <EmptyWrapper>
            <EmptyWrapper>
              <TrackedComponent />
              <EmptyWrapper>
                <EmptyWrapper>
                  <TrackedComponent />
                </EmptyWrapper>
              </EmptyWrapper>
            </EmptyWrapper>
          </EmptyWrapper>
        </EmptyWrapper>
      </EmptyWrapper>
    </EmptyWrapper>
  );
};
