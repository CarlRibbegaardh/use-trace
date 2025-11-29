export const traceExit = (scopeName: string) => {
  return (message?: unknown, ...optionalParams: unknown[]): void => {
    if (message || (optionalParams && optionalParams.length > 0)) {
      console.log(
        `[${scopeName}]%c ${message}`,
        "font-weight: bold",
        ...optionalParams
      );
    }

    console.groupEnd();
  };
};
