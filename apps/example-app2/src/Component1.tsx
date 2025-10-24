import { useCallback, useState } from "react";
import { useAutoTrace } from "use-trace";

export function Component1() {
  useAutoTrace();
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(count + 1);
  }, [count]);

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
