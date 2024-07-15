import { useTrace } from "use-trace";

export interface ComponentProps {
  counter1: number;
  message: string;
}

export function Component2({ counter1, message }: ComponentProps) {
  // Pass the name of the component to the useTrace hook, and optionally an object with the initial state.
  const trace = useTrace("Component2", { counter1, message });

  trace.exit();
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
    </>
  );
}
