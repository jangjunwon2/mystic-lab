import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ko", "ja", "zh-CN", "es", "fr", "de"],
  defaultLocale: "en",
  localePrefix: "always",
});
