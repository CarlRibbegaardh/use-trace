import { useState } from "react";
import { useTrackRender } from "use-trace";

export function Component() {
  useTrackRender();
  const [count, setCount] = useState(0);

  // This handleClick function is recreated every time the component is rendered.
  const handleClick = () => {
    setCount((c) => c + 1);
  };

  return (
    <>
      <h2>"Component"</h2>
      <div>
        This component doesn't use callback and is recreating the eventhandler
        every render.
      </div>
      <div className="card">
        <button onClick={handleClick}>count is {count}</button>
      </div>
    </>
  );
}
