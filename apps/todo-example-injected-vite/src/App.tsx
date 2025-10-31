import React, { useEffect } from "react";
import {
  Container,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Box,
} from "@mui/material";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { AddTodoForm } from "./components/AddTodoForm";
import { TodoList } from "./components/TodoList";
import { TestComponent } from "./components/TestComponent";
import { TodoService } from "./domain/TodoService";
import { InMemoryTodoRepository } from "./infrastructure/InMemoryTodoRepository";
import { useAppDispatch } from "./hooks/redux";
import { fetchTodos } from "./store/todoSlice";

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

        <Box sx={{ mt: 4, p: 2, border: "1px dashed #ccc", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Auto-Injection Demo:
          </Typography>
          <TestComponent
            label="Click me (auto-traced!)"
            onClick={() => console.log("TestComponent clicked!")}
          />
        </Box>
      </Container>
    </>
  );
};

function App() {
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
