import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Todo } from '../domain/Todo';
import { TodoService, CreateTodoCommand, UpdateTodoCommand, ToggleTodoCommand, DeleteTodoCommand } from '../domain/TodoService';

export interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  filter: 'all' | 'pending' | 'completed';
}

const initialState: TodoState = {
  todos: [],
  loading: false,
  error: null,
  filter: 'all'
};

// Async thunks for todo operations
export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (todoService: TodoService) => {
    return await todoService.getAllTodos();
  }
);

export const createTodo = createAsyncThunk(
  'todos/createTodo',
  async ({ todoService, command }: { todoService: TodoService; command: CreateTodoCommand }) => {
    return await todoService.createTodo(command);
  }
);

export const updateTodo = createAsyncThunk(
  'todos/updateTodo',
  async ({ todoService, command }: { todoService: TodoService; command: UpdateTodoCommand }) => {
    return await todoService.updateTodo(command);
  }
);

export const toggleTodo = createAsyncThunk(
  'todos/toggleTodo',
  async ({ todoService, command }: { todoService: TodoService; command: ToggleTodoCommand }) => {
    return await todoService.toggleTodo(command);
  }
);

export const deleteTodo = createAsyncThunk(
  'todos/deleteTodo',
  async ({ todoService, command }: { todoService: TodoService; command: DeleteTodoCommand }) => {
    const success = await todoService.deleteTodo(command);
    if (success) {
      return command.id;
    }
    throw new Error('Todo not found');
  }
);

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<'all' | 'pending' | 'completed'>) => {
      state.filter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
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
        state.error = action.error.message || 'Failed to fetch todos';
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
        state.error = action.error.message || 'Failed to create todo';
      })

      // Update todo
      .addCase(updateTodo.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.todos.findIndex(todo => todo.id === action.payload!.id);
          if (index !== -1) {
            state.todos[index] = action.payload;
          }
        }
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update todo';
      })

      // Toggle todo
      .addCase(toggleTodo.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.todos.findIndex(todo => todo.id === action.payload!.id);
          if (index !== -1) {
            state.todos[index] = action.payload;
          }
        }
      })
      .addCase(toggleTodo.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to toggle todo';
      })

      // Delete todo
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.todos = state.todos.filter(todo => todo.id !== action.payload);
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete todo';
      });
  }
});

export const { setFilter, clearError } = todoSlice.actions;
export default todoSlice.reducer;
