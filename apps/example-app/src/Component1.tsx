import { useTrace } from "use-trace";
import { useCallback, useState } from "react";

export function Component1() {
  const trace = useTrace("Component1");
  const [count, setCount] = useState(0);

  // This handleClick function is recreated every time the component is rendered.
  const handleClick = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  trace.state({ count, setCount, handleClick });

  trace.exit();
  return (
    <>
      <h2>"Component1"</h2>
      <div>This button uses callback and has more stable state</div>
      <div className="card">
        <button onClick={handleClick}>count is {count}</button>
      </div>
    </>
  );
}
