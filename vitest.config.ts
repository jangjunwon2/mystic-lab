import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// 순수 로직 단위 테스트용. 컴포넌트/DOM 불필요 → node 환경.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
