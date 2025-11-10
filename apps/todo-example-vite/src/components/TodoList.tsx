import React from "react";
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  List as ListIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
} from "@mui/icons-material";
import { TodoItem } from "./TodoItem";
import { useAppSelector, useAppDispatch } from "../hooks/redux";
import {
  setFilter,
  clearError,
  selectFilteredTodos,
  selectTodosLoading,
  selectTodosError,
  selectTodosFilter,
} from "../store/todoSlice";
import { TodoService } from "../domain/TodoService";
import { useAutoTracer } from "@auto-tracer/react18";

interface TodoListProps {
  todoService: TodoService;
}

export const TodoList: React.FC<TodoListProps> = ({ todoService }) => {
  const logger = useAutoTracer();

  const dispatch = useAppDispatch();
  const filteredTodos = useAppSelector(selectFilteredTodos);
  logger.log("About to call labelState for filteredTodos");
  logger.labelState(0, "filteredTodos", filteredTodos);
  const loading = useAppSelector(selectTodosLoading);
  logger.log("About to call labelState for loading");
  logger.labelState(1, "loading", loading);
  const error = useAppSelector(selectTodosError);
  logger.labelState(2, "error", error);
  const filter = useAppSelector(selectTodosFilter);
  logger.labelState(3, "filter", filter);

  const handleFilterChange = (
    _: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    if (newFilter !== null) {
      dispatch(setFilter(newFilter as "all" | "pending" | "completed"));
    }
  };

  const handleCloseError = () => {
    dispatch(clearError());
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert
          severity="error"
          onClose={handleCloseError}
          sx={{ mb: 2 }}
          data-testid="error-alert"
        >
          {error}
        </Alert>
      )}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Todos ({filteredTodos.length})</Typography>

        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          aria-label="todo filter"
          data-testid="filter-buttons"
        >
          <ToggleButton value="all" aria-label="all todos">
            <ListIcon sx={{ mr: 1 }} />
            All
          </ToggleButton>
          <ToggleButton value="pending" aria-label="pending todos">
            <PendingIcon sx={{ mr: 1 }} />
            Pending
          </ToggleButton>
          <ToggleButton value="completed" aria-label="completed todos">
            <CheckCircleIcon sx={{ mr: 1 }} />
            Completed
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {filteredTodos.length === 0 ? (
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          py={4}
          data-testid="empty-todos-message"
        >
          {filter === "all"
            ? "No todos yet. Add your first todo above!"
            : `No ${filter} todos.`}
        </Typography>
      ) : (
        <Box data-testid="todos-list">
          {filteredTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} todoService={todoService} />
          ))}
        </Box>
      )}
    </Box>
  );
};
