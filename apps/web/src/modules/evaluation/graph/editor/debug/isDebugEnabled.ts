/// <reference types="vite/client" />

export function isDebugEnabled(): boolean {
  return import.meta.env.VITE_DEBUG === "true";
}
