import { useCallback, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Component } from "./Component";
import { Component2 } from "./Component2";
import { Component1 } from "./Component1";
import { useAutoTracer } from "auto-tracer";

function App() {
  useAutoTracer();
  // When initializing the trace, you can pass a name and an optional object with the initial state.
  const [count1, setCount1] = useState(0);
  const [banana, setBanana] = useState("banana-value");
  const [tag, setTag] = useState("initial-tag");

  const handleClick1 = useCallback(() => {
    setCount1(count1 + 1);
    setBanana(banana + `${count1 + 1}`);
    setTag(tag + `${count1 + 1}`);
  }, [banana, count1, tag]);

  if (count1 % 2 === 0) {
    // You can use trace.log() to log any message.
    console.log("Count1 is even. count1 =", count1);
  }

  if (count1 === -1) {
    // You always need to call trace.exit() before returning from the function.
    console.log("Impossible exit from App");
    return null;
  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <p>
        Open DevTools and look at the console to see the trace logs, while
        pressing the buttons.
      </p>
      <div className="card">
        <button onClick={handleClick1}>Count1 is {count1}</button>
        <hr />
        <Component />
        <hr />
        <Component1 />
        <hr />
        <Component2 counter1={count1} message="A static string" />
      </div>
    </>
  );
}

export default App;
