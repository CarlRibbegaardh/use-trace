import { useCallback, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useTrace } from "use-trace";
import { Component } from "./Component";
import { Component2 } from "./Component2";
import { Component1 } from "./Component1";

function App() {
  // When initializing the trace, you can pass a name and an optional object with the initial state.
  const trace = useTrace("App");
  const [count1, setCount1] = useState(0);

  const handleClick1 = useCallback(() => {
    setCount1(count1 + 1);
  }, [count1]);

  // You can use trace.state() to log anything that is state of the component.
  // Remember functions are also a form of state, that can be static or recreated.
  trace.state({
    count1,
    setCount1,
    handleClick1,
  });

  if (count1 % 2 === 0) {
    // You can use trace.log() to log any message.
    trace.log("Count1 is even. count1 =", count1);
  }

  if (count1 === -1) {
    // You always need to call trace.exit() before returning from the function.
    trace.exit("Impossible exit from App");
    return null;
  }

  trace.exit("Rendering App");
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
