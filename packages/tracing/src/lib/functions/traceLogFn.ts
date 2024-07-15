export const traceLogFn = (scopeName: string) => {
  return (message?: unknown, ...optionalParams: unknown[]): void => {
    console.log(
      `[${scopeName}]%c ${message}`,
      "font-weight: bold",
      ...optionalParams
    );
  };
};
