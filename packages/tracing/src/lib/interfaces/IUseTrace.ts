export interface IUseTrace {
  state: (scopeObject?: object) => void;
  log: (message?: unknown, ...optionalParams: unknown[]) => void;
  exit: (message?: unknown, ...optionalParams: unknown[]) => void;
}
