// Vitest/Vite does not resolve Next.js' server-only marker package by default.
// This shim preserves the production import while allowing server modules to be
// exercised in the test runtime. It intentionally exports no behavior.
export {};
