"use client";
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Checkbox,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Todo } from '../domain/Todo';
import { useAppDispatch } from '../hooks/redux';
import { toggleTodo, deleteTodo } from '../store/todoSlice';
import { TodoService } from '../domain/TodoService';

interface TodoItemProps {
  todo: Todo;
  todoService: TodoService;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, todoService }) => {
  const dispatch = useAppDispatch();

  const handleToggle = async () => {
    try {
      await dispatch(toggleTodo({
        todoService,
        command: { id: todo.id }
      })).unwrap();
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteTodo({
        todoService,
        command: { id: todo.id }
      })).unwrap();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        opacity: todo.completed ? 0.7 : 1,
        backgroundColor: todo.completed ? 'grey.50' : 'background.paper'
      }}
      data-testid={`todo-item-${todo.id}`}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Checkbox
            checked={todo.completed}
            onChange={handleToggle}
            data-testid={`todo-checkbox-${todo.id}`}
          />
          <Box flex={1}>
            <Typography
              variant="h6"
              sx={{
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? 'text.secondary' : 'text.primary'
              }}
              data-testid={`todo-title-${todo.id}`}
            >
              {todo.title}
            </Typography>
            {todo.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
                data-testid={`todo-description-${todo.id}`}
              >
                {todo.description}
              </Typography>
            )}
            <Box display="flex" gap={1} mt={2}>
              <Chip
                size="small"
                label={todo.completed ? 'Completed' : 'Pending'}
                color={todo.completed ? 'success' : 'default'}
                data-testid={`todo-status-${todo.id}`}
              />
              <Chip
                size="small"
                label={`Created: ${todo.createdAt.toLocaleDateString()}`}
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
      </CardContent>
      <CardActions>
        <IconButton
          onClick={handleDelete}
          color="error"
          data-testid={`todo-delete-${todo.id}`}
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};
