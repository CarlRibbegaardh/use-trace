import { useState } from 'react'
import './App.css'

interface Todo {
  id: number
  text: string
  completed: boolean
}

function App() {
  const [count, setCount] = useState(0)
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [showCounter, setShowCounter] = useState(true)
  const [showTodos, setShowTodos] = useState(true)

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }])
      setInput('')
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="island-app">
      <div className="controls">
        <button onClick={() => setShowCounter(!showCounter)}>
          {showCounter ? 'Hide' : 'Show'} Counter
        </button>
        <button onClick={() => setShowTodos(!showTodos)}>
          {showTodos ? 'Hide' : 'Show'} Todos
        </button>
      </div>

      {showCounter && (
        <div className="section">
          <h3>Counter</h3>
          <div className="counter">
            <button onClick={() => setCount(count - 1)}>-</button>
            <span className="count">{count}</span>
            <button onClick={() => setCount(count + 1)}>+</button>
          </div>
        </div>
      )}

      {showTodos && (
        <div className="section">
          <h3>Todo List</h3>
          <div className="todo-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a todo..."
            />
            <button onClick={addTodo}>Add</button>
          </div>
          <ul className="todo-list">
            {todos.map(todo => (
              <li key={todo.id} className={todo.completed ? 'completed' : ''}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
                <button onClick={() => deleteTodo(todo.id)}>×</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App
