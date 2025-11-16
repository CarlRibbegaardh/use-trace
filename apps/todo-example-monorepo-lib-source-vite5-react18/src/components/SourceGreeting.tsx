import React, { useState } from "react";
import { Card, CardContent, Typography, TextField, Box } from "@mui/material";

/**
 * A simple greeting component from the source library.
 * This component will be bundled directly from source by the app.
 */
export const SourceGreeting: React.FC = () => {
  const [name, setName] = useState("World");

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Source Library with no auto-tracer knowledge.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          This component comes from the source workspace library (bundled
          directly).
          <br />
          It will automatically be injected from it's app performing the
          bundling.
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <TextField
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            data-testid="source-name-input"
          />
          <Typography variant="h4" data-testid="source-greeting">
            Hello, {name}!
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
