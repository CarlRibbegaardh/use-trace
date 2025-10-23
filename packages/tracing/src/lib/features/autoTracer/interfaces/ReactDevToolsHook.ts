interface ReactDevToolsHook {
  onCommitFiberRoot:
    | ((rendererID: number, root: unknown, priorityLevel?: number) => void)
    | null;
  [key: string]: unknown;
}

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevToolsHook;
  }
}

export type { ReactDevToolsHook };
