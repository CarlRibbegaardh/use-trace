// @trace
import React, { useEffect } from "react";
import { Button } from "@mui/material";
import { useMultiValueHook } from "../hooks/multiValueHook";

interface TestComponentProps {
  label: string;
  onClick: () => void;
}

export const TestComponent: React.FC<TestComponentProps> = ({
  label,
  onClick,
}) => {
  const { count, increment, reset, setCount, setValue, value } =
    useMultiValueHook("initial-value");

  useEffect(() => {
    setCount(5);
    setValue("updated-value");
  }, [setCount, setValue]);

  console.log("TestComponent render:", { count, value, increment, reset });
  return (
    <Button variant="contained" onClick={onClick}>
      {label}
    </Button>
  );
};
