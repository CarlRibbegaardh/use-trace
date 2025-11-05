// This component should get useAutoTracer() auto-injected in opt-out mode
// since there's no @trace-disable pragma
export const AutoInjectTest = () => {
  return (
    <div style={{ padding: "10px", border: "2px solid green", margin: "10px" }}>
      <h3>Auto-Inject Test Component</h3>
      <p>This component should have useAutoTracer() automatically injected.</p>
      <p>Check the browser dev tools console for trace logs.</p>
    </div>
  );
};

// This arrow function component should also get auto-injected
export const ArrowTest = () => (
  <div style={{ padding: "10px", border: "2px solid blue", margin: "10px" }}>
    <p>Arrow function component - should also be auto-injected</p>
  </div>
);

// This should NOT get auto-injected due to the disable pragma
// @trace-disable
export const DisabledTest = () => {
  return (
    <div style={{ padding: "10px", border: "2px solid red", margin: "10px" }}>
      <p>This component has @trace-disable - should NOT be auto-injected</p>
    </div>
  );
};
