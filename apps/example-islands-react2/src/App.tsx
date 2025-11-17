import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showTimer, setShowTimer] = useState(true)
  const [showForm, setShowForm] = useState(true)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  const resetForm = () => {
    setName('')
    setEmail('')
  }

  return (
    <div className="island-app">
      <div className="controls">
        <button onClick={() => setShowTimer(!showTimer)}>
          {showTimer ? 'Hide' : 'Show'} Timer
        </button>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hide' : 'Show'} Form
        </button>
      </div>

      {showTimer && (
        <div className="section">
          <h3>Timer</h3>
          <div className="timer">
            <div className="time">{seconds}s</div>
          <div className="timer-controls">
            <button onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? 'Pause' : 'Start'}
              </button>
              <button onClick={() => { setSeconds(0); setIsRunning(false) }}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="section">
          <h3>User Form</h3>
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="form-actions">
              <button type="submit">Submit</button>
              <button type="button" onClick={resetForm}>Clear</button>
            </div>
            {submitted && <div className="success">Form submitted!</div>}
          </form>
        </div>
      )}
    </div>
  )
}

export default App
