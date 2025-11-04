"use client";
import React, { useState } from "react";
import { TextField, Button, Paper, Box, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useAppDispatch } from "../hooks/redux";
import { createTodo, selectTodosLoading } from "../store/todoSlice";
import { TodoService } from "../domain/TodoService";

interface AddTodoFormProps {
  todoService: TodoService;
}

export const AddTodoForm: React.FC<AddTodoFormProps> = ({ todoService }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim()) {
      try {
        await dispatch(
          createTodo({
            todoService,
            command: {
              title: title.trim(),
              description: description.trim() || undefined,
            },
          })
        ).unwrap();

        setTitle("");
        setDescription("");
      } catch (error) {
        console.error("Failed to create todo:", error);
      }
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Add New Todo
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
          data-testid="todo-title-input"
        />
        <TextField
          fullWidth
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={2}
          data-testid="todo-description-input"
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<AddIcon />}
          disabled={!title.trim()}
          sx={{ mt: 2 }}
          data-testid="add-todo-button"
        >
          Add Todo
        </Button>
      </Box>
    </Paper>
  );
};
