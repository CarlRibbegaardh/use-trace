"use client";

import React, { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { AddTodoForm } from "./AddTodoForm";
import { TodoList } from "./TodoList";
import { TestComponent } from "./TestComponent";
import {
  LabelHooksTestComponent,
  LabelHooksPatternTestComponent,
} from "./LabelHooksTestComponents";
import { TodoService } from "../domain/TodoService";
import { InMemoryTodoRepository } from "../infrastructure/InMemoryTodoRepository";
import { useAppDispatch } from "../hooks/redux";
import { fetchTodos } from "../store/todoSlice";

// Create singleton instances
const todoRepository = new InMemoryTodoRepository();
const todoService = new TodoService(todoRepository);

/**
 * Client component that handles all interactive todo functionality.
 * This component manages Redux state and contains the interactive UI elements.
 */
export default function TodoAppClient(): JSX.Element {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchTodos(todoService));
  }, [dispatch]);

  return (
    <>
      {/* Main todo functionality */}
      <AddTodoForm todoService={todoService} />
      <TodoList todoService={todoService} />

      {/* Auto-injection demo components */}
      <Box sx={{ mt: 4, p: 2, border: "1px dashed #ccc", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Auto-Injection Demo:
        </Typography>
        <TestComponent
          label="Click me (auto-traced!)"
          onClick={() => console.log('TestComponent clicked!')}
        />
      </Box>

      <Box sx={{ mt: 4, p: 2, border: "1px dashed #999", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Label Hooks Test:
        </Typography>
        <LabelHooksTestComponent />
      </Box>

      <Box sx={{ mt: 4, p: 2, border: "1px dashed #666", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Label Hooks Pattern Test:
        </Typography>
        <LabelHooksPatternTestComponent />
      </Box>
    </>
  );
}
