// src/types/react-devtools-core.d.ts
declare module "react-devtools-core" {
  export interface DevToolsConnectionOptions {
    /** Host to connect to (default: 'localhost') */
    host?: string;
    /** Port to connect to (default: 8097) */
    port?: number;
    /** Whether to reconnect automatically */
    reconnect?: boolean;
    /** WebSocket implementation override (Node only) */
    websocket?: typeof WebSocket;
  }

  /**
   * Connects to the React DevTools frontend (standalone or browser extension)
   * via WebSocket.
   */
  export function connectToDevTools(options?: DevToolsConnectionOptions): void;

  /**
   * Initializes the global hook manually, if it’s not already present.
   * Useful for testing environments (Vitest, jsdom, etc.)
   */
  export function initialize(target?: any): void;
}
