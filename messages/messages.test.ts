import { describe, expect, it } from "vitest";

import en from "./en.json";
import pl from "./pl.json";

const flattenKeys = (value: object, prefix = ""): string[] =>
    Object.entries(value).flatMap(([key, child]) =>
        typeof child === "object" && child !== null ? flattenKeys(child, `${prefix}${key}.`) : [`${prefix}${key}`],
    );

describe("translations", () => {
    it("en.json has exactly the same keys as pl.json", () => {
        expect(flattenKeys(en).sort()).toEqual(flattenKeys(pl).sort());
    });

    it("has no empty messages", () => {
        for (const messages of [pl, en]) {
            const flat = flattenKeys(messages);
            expect(flat.length).toBeGreaterThan(0);
        }
        const empty = (messages: object) =>
            JSON.stringify(messages).match(/:\s*""/g) ?? [];
        expect(empty(pl)).toEqual([]);
        expect(empty(en)).toEqual([]);
    });
});
