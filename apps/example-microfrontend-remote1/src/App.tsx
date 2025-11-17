import { useState } from "react";
import "./App.css";

/**
 * Counter component for Remote 1
 */
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="counter">
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

/**
 * Todo list component for Remote 1
 */
function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput("");
    }
  };

  return (
    <div className="todo-list">
      <h4>Todo List</h4>
      <div className="todo-input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul>
        {todos.map((todo, idx) => (
          <li key={idx}>{todo}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Remote 1 App - Exposed to host via Module Federation
 */
function App() {
  const [showCounter, setShowCounter] = useState(true);
  const [showTodos, setShowTodos] = useState(true);

  return (
    <div className="remote-app remote1">
      <div className="remote-header">
        <h2>🟦 Remote 1 Application</h2>
        <p>Counter and Todo List Components</p>
      </div>

      <div className="toggle-buttons">
        <button onClick={() => setShowCounter(!showCounter)}>
          {showCounter ? "Hide" : "Show"} Counter
        </button>
        <button onClick={() => setShowTodos(!showTodos)}>
          {showTodos ? "Hide" : "Show"} Todos
        </button>
      </div>

      <div className="components-grid">
        {showCounter && <Counter />}
        {showTodos && <TodoList />}
      </div>
    </div>
  );
}

export default App;
