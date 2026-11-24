import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Threads: no child processes to kill (forks can hang in sandboxed shells)
    pool: "threads",
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
