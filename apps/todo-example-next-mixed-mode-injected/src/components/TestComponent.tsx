// @trace
"use client";
import React from 'react';
import { Button } from '@mui/material';

interface TestComponentProps {
  label: string;
  onClick: () => void;
}

export const TestComponent: React.FC<TestComponentProps> = ({ label, onClick }) => {
  return (
    <Button variant="contained" onClick={onClick}>
      {label}
    </Button>
  );
};
