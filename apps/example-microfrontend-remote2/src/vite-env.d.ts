/// <reference types="vite/client" />

declare global {
  interface Window {
    __AUTOTRACER_INITIALIZED__?: boolean;
  }
}

export {};
