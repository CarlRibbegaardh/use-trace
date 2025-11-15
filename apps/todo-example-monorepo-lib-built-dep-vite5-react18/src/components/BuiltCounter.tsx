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
          Built Library Counter WITH auto-tracer.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          This component comes from the pre-built workspace library with
          auto-tracer injected.
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
