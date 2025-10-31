import { useAutoTracer } from "use-trace";
import { Component1 } from "./Component1";

export interface ComponentProps {
  counter1: number;
  message: string;
}

export function Component2({ counter1, message }: ComponentProps) {
  useAutoTracer();
  return (
    <>
      <h2>"Component2"</h2>
      <div>
        This component rerenders on prop changes only. The message is only
        output the first render.
      </div>
      <em>Component message: {message}</em>
      <br />
      <strong>Counter1 from App: {counter1}</strong>

      <Component1 key="hello" />
    </>
  );
}
