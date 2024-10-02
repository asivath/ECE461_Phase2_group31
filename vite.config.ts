import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/**.test.ts"],
    coverage: {
      reporter: ["json-summary", "html"],
      include: ["src/**"],
      exclude: ["src/tests/**"],
      thresholds: {
        statements: 80,
        functions: 100,
        lines: 80
      },
      ignoreEmptyLines: true,
      reportOnFailure: true
    },
    hookTimeout: 30000
  }
});
