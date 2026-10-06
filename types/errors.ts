import type messages from "@/messages/pl.json";

/** Keys of the `errors` namespace. Server Actions return these instead of display text. */
export type ErrorKey = keyof (typeof messages)["errors"];

/** Keys of `login.errors`. */
export type LoginErrorKey = keyof (typeof messages)["login"]["errors"];
