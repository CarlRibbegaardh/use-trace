/**
 * Simple demo to trigger identical value change warnings
 */

import React, { useState } from "react";
import { Button, Box, Typography } from "@mui/material";

/**
 * This component demonstrates identical value changes by:
 * 1. Keeping the same data content
 * 2. Creating a NEW object/array with that content on each click
 * 3. Setting state to this new object (different reference, same value)
 */
export const SimpleIdenticalValueDemo: React.FC = () => {
  const [emptyArray, setEmptyArray] = useState<number[]>([]);
  const [emptyObject, setEmptyObject] = useState({});
  const [simpleArray, setSimpleArray] = useState([1, 2, 3]);
  const [simpleObject, setSimpleObject] = useState({ id: 1, name: "test" });

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        Click buttons below to trigger identical value changes.
        <br />
        Check console for ⚠️ warnings!
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => setEmptyArray([])} // New [] with same content
        >
          Empty Array: {JSON.stringify(emptyArray)}
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={() => setEmptyObject({})} // New {} with same content
        >
          Empty Object: {JSON.stringify(emptyObject)}
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={() => setSimpleArray([1, 2, 3])} // New array with same values
        >
          Array: {JSON.stringify(simpleArray)}
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={() => setSimpleObject({ id: 1, name: "test" })} // New object with same values
        >
          Object: {JSON.stringify(simpleObject)}
        </Button>
      </Box>
    </Box>
  );
};
