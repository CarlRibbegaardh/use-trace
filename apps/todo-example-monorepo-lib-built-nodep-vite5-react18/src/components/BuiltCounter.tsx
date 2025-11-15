import React, { useState } from "react";
import { Button, Card, CardContent, Typography, Box } from "@mui/material";

/**
 * A simple counter component from the built library.
 * This component will be pre-compiled before being used by the app.
 */
export const BuiltCounter: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Built Library Counter with no auto-tracer knowledge.
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          component="div"
          sx={{ mb: 2 }}
        >
          This component comes from the pre-built workspace library with no
          auto-tracer dependency.
          <br />
          The only way for this library to be seen is through the setting
          <ul>
            <li>includeNonTrackedBranches: true</li>
          </ul>
          and the settings
          <ul>
            <li>
              includeRendered: "forPropsOrState" or "forState" (for changes)
            </li>
            <li>
              includeMount: "forPropsOrState" or "forState" (for initial data)
            </li>
          </ul>
          Note that this might introduce a lot of noise. The skippedObjectProps
          setting is used to filter that noise.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="contained"
            onClick={() => setCount((c) => c + 1)}
            data-testid="built-increment"
          >
            Increment
          </Button>
          <Button
            variant="outlined"
            onClick={() => setCount(0)}
            data-testid="built-reset"
          >
            Reset
          </Button>
          <Typography variant="h4" data-testid="built-count">
            {count}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
