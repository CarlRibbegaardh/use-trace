/**
 * DetectIdenticalValueChangesDemo component
 *
 * Demonstrates all 6 scenarios where identical values cause unnecessary re-renders:
 * 1. Object wrapper creation (same data wrapped in new object)
 * 2. Array creation (same data in new array)
 * 3. Inline object creation (new object with same shape)
 * 4. Redux selector without memoization
 * 5. Inline function creation
 * 6. Object with function property
 *
 * This component is used for E2E testing of the detectIdenticalValueChanges feature.
 */

import React, { useState } from "react";
import { Button, Box, Typography } from "@mui/material";

/**
 * Scenario 1: Object wrapper creation
 * Creates new object wrapper around same data each render
 */
export const ObjectWrapperScenario: React.FC = () => {
  const [data] = useState({ id: 1, name: "test" });
  const [trigger, setTrigger] = useState(0);

  // Wrapping the same data in a new object each time
  const wrappedData = { data }; // New object each render!

  return (
    <Box sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}>
      <Typography variant="subtitle2">
        Scenario 1: Object Wrapper ({wrappedData.data.name})
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setTrigger((prev) => prev + 1)}
      >
        Trigger Re-render ({trigger})
      </Button>
    </Box>
  );
};

/**
 * Scenario 2: Array creation
 * Creates new array with same data each render
 */
export const ArrayCreationScenario: React.FC = () => {
  const [items] = useState([1, 2, 3]);
  const [trigger, setTrigger] = useState(0);

  // Creating new array from same data each time
  const processedItems = [...items]; // New array each render!

  return (
    <Box sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}>
      <Typography variant="subtitle2">
        Scenario 2: Array Creation ({processedItems.length} items)
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setTrigger((prev) => prev + 1)}
      >
        Trigger Re-render ({trigger})
      </Button>
    </Box>
  );
};

/**
 * Scenario 3: Inline object creation
 * Creates new object with same shape each render
 */
export const InlineObjectScenario: React.FC = () => {
  const [trigger, setTrigger] = useState(0);

  // Creating inline object with same values each time
  const config = { theme: "dark", language: "en" }; // New object each render!

  return (
    <Box sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}>
      <Typography variant="subtitle2">
        Scenario 3: Inline Object ({config.theme})
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setTrigger((prev) => prev + 1)}
      >
        Trigger Re-render ({trigger})
      </Button>
    </Box>
  );
};

/**
 * Scenario 4: Redux selector without memoization
 * Simulates unmemoized selector returning new object
 */
export const UnmemoizedSelectorScenario: React.FC = () => {
  const [state] = useState({ todos: ["task1", "task2"] });
  const [trigger, setTrigger] = useState(0);

  // Unmemoized selector creates new object each time
  const selectedData = { todos: state.todos.filter(() => true) }; // New object each render!

  return (
    <Box sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}>
      <Typography variant="subtitle2">
        Scenario 4: Unmemoized Selector ({selectedData.todos.length} todos)
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setTrigger((prev) => prev + 1)}
      >
        Trigger Re-render ({trigger})
      </Button>
    </Box>
  );
};

/**
 * Scenario 5: Inline function creation
 * Creates new function with same behavior each render
 */
export const InlineFunctionScenario: React.FC = () => {
  const [trigger, setTrigger] = useState(0);

  // Creating inline function each render (should NOT be flagged as identical value)
  const handleClick = () => console.log("clicked"); // New function each render!

  return (
    <Box sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}>
      <Typography variant="subtitle2">
        Scenario 5: Inline Function
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={() => {
          handleClick();
          setTrigger((prev) => prev + 1);
        }}
      >
        Trigger Re-render ({trigger})
      </Button>
    </Box>
  );
};

/**
 * Scenario 6: Object with function property
 * Creates new object containing function property each render
 */
export const ObjectWithFunctionScenario: React.FC = () => {
  const [trigger, setTrigger] = useState(0);

  // Creating object with function property each render
  const actions = {
    onClick: () => console.log("action"),
    label: "Click me",
  }; // New object each render!

  return (
    <Box sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}>
      <Typography variant="subtitle2">
        Scenario 6: Object with Function ({actions.label})
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={() => {
          actions.onClick();
          setTrigger((prev) => prev + 1);
        }}
      >
        Trigger Re-render ({trigger})
      </Button>
    </Box>
  );
};

/**
 * Main demo component that combines all scenarios
 */
export const DetectIdenticalValueChangesDemo: React.FC = () => {
  return (
    <Box>
      <ObjectWrapperScenario />
      <ArrayCreationScenario />
      <InlineObjectScenario />
      <UnmemoizedSelectorScenario />
      <InlineFunctionScenario />
      <ObjectWithFunctionScenario />
    </Box>
  );
};
