import type { Locale } from "@/i18n/config";
import type messages from "@/messages/pl.json";

// Polish is the source of truth: keys used in code are type-checked against messages/pl.json,
// and messages.test.ts checks that en.json has exactly the same keys.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
