import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import { Todo } from "../domain/Todo";
import {
  TodoService,
  CreateTodoCommand,
  UpdateTodoCommand,
  ToggleTodoCommand,
  DeleteTodoCommand,
} from "../domain/TodoService";

// Serialized version of Todo for Redux state (dates as strings)
export interface SerializedTodo {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly completed: boolean;
  readonly createdAt: string; // ISO string instead of Date
  readonly updatedAt: string; // ISO string instead of Date
}

export interface TodoState {
  todos: SerializedTodo[]; // Use serialized version in state
  loading: boolean;
  error: string | null;
  filter: "all" | "pending" | "completed";
}

// Helper functions to convert between Todo and SerializedTodo
const serializeTodo = (todo: Todo): SerializedTodo => ({
  ...todo,
  createdAt: todo.createdAt.toISOString(),
  updatedAt: todo.updatedAt.toISOString(),
});

const deserializeTodo = (serializedTodo: SerializedTodo): Todo => ({
  ...serializedTodo,
  createdAt: new Date(serializedTodo.createdAt),
  updatedAt: new Date(serializedTodo.updatedAt),
});

const initialState: TodoState = {
  todos: [],
  loading: false,
  error: null,
  filter: "all",
};

// Async thunks for todo operations
export const fetchTodos = createAsyncThunk(
  "todos/fetchTodos",
  async (todoService: TodoService) => {
    const todos = await todoService.getAllTodos();
    return todos.map(serializeTodo);
  }
);

export const createTodo = createAsyncThunk(
  "todos/createTodo",
  async ({
    todoService,
    command,
  }: {
    todoService: TodoService;
    command: CreateTodoCommand;
  }) => {
    const todo = await todoService.createTodo(command);
    return serializeTodo(todo);
  }
);

export const updateTodo = createAsyncThunk(
  "todos/updateTodo",
  async ({
    todoService,
    command,
  }: {
    todoService: TodoService;
    command: UpdateTodoCommand;
  }) => {
    const todo = await todoService.updateTodo(command);
    return todo ? serializeTodo(todo) : null;
  }
);

export const toggleTodo = createAsyncThunk(
  "todos/toggleTodo",
  async ({
    todoService,
    command,
  }: {
    todoService: TodoService;
    command: ToggleTodoCommand;
  }) => {
    const todo = await todoService.toggleTodo(command);
    return todo ? serializeTodo(todo) : null;
  }
);

export const deleteTodo = createAsyncThunk(
  "todos/deleteTodo",
  async ({
    todoService,
    command,
  }: {
    todoService: TodoService;
    command: DeleteTodoCommand;
  }) => {
    const success = await todoService.deleteTodo(command);
    if (success) {
      return command.id;
    }
    throw new Error("Todo not found");
  }
);

const todoSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    setFilter: (
      state,
      action: PayloadAction<"all" | "pending" | "completed">
    ) => {
      state.filter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch todos
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch todos";
      })

      // Create todo
      .addCase(createTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.todos.unshift(action.payload);
      })
      .addCase(createTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create todo";
      })

      // Update todo
      .addCase(updateTodo.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.todos.findIndex(
            (todo) => todo.id === action.payload!.id
          );
          if (index !== -1) {
            state.todos[index] = action.payload;
          }
        }
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update todo";
      })

      // Toggle todo
      .addCase(toggleTodo.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.todos.findIndex(
            (todo) => todo.id === action.payload!.id
          );
          if (index !== -1) {
            state.todos[index] = action.payload;
          }
        }
      })
      .addCase(toggleTodo.rejected, (state, action) => {
        state.error = action.error.message || "Failed to toggle todo";
      })

      // Delete todo
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.todos = state.todos.filter((todo) => todo.id !== action.payload);
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete todo";
      });
  },
});

export const { setFilter, clearError } = todoSlice.actions;

// Selectors that convert serialized todos back to Todo objects
const selectTodosState = (state: { todos: TodoState }) => state.todos;

export const selectAllTodos = createSelector([selectTodosState], (todosState) =>
  todosState.todos.map(deserializeTodo)
);

export const selectTodoById = createSelector(
  [selectTodosState, (_state: { todos: TodoState }, id: string) => id],
  (todosState, id) => {
    const serializedTodo = todosState.todos.find((todo) => todo.id === id);
    return serializedTodo ? deserializeTodo(serializedTodo) : null;
  }
);

export const selectFilteredTodos = createSelector(
  [selectAllTodos, selectTodosState],
  (todos, todosState) => {
    const { filter } = todosState;

    switch (filter) {
      case "pending":
        return todos.filter((todo) => !todo.completed);
      case "completed":
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }
);

export const selectTodosLoading = createSelector(
  [selectTodosState],
  (todosState) => todosState.loading
);

export const selectTodosError = createSelector(
  [selectTodosState],
  (todosState) => todosState.error
);

export const selectTodosFilter = createSelector(
  [selectTodosState],
  (todosState) => todosState.filter
);

export default todoSlice.reducer;
