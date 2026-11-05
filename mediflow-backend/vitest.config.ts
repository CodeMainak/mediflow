import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts"],
        hookTimeout: 120000, // the first run downloads a MongoDB binary
        env: { JWT_SECRET: "test-only-secret" },
    },
});
