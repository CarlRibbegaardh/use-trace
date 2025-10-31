import React, { useEffect } from "react";
import {
  Container,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
} from "@mui/material";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { AddTodoForm } from "./components/AddTodoForm";
import { TodoList } from "./components/TodoList";
import { TodoService } from "./domain/TodoService";
import { InMemoryTodoRepository } from "./infrastructure/InMemoryTodoRepository";
import { useAppDispatch } from "./hooks/redux";
import { fetchTodos } from "./store/todoSlice";
import { useAutoTracer } from "use-trace";

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

// Create singleton instances
const todoRepository = new InMemoryTodoRepository();
const todoService = new TodoService(todoRepository);

const TodoApp: React.FC = () => {
  useAutoTracer();

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchTodos(todoService));
  }, [dispatch]);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            Todo App
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom textAlign="center">
          My Todo List
        </Typography>

        <AddTodoForm todoService={todoService} />
        <TodoList todoService={todoService} />
      </Container>
    </>
  );
};

function App() {
  useAutoTracer();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Provider store={store}>
        <TodoApp />
      </Provider>
    </ThemeProvider>
  );
}

export default App;
