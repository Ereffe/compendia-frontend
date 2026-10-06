import type messages from "@/messages/pl.json";

export type ErrorKey = keyof (typeof messages)["errors"];

export type LoginErrorKey = keyof (typeof messages)["login"]["errors"];
