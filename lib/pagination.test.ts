import { describe, expect, it } from "vitest";

import { parsePageParam } from "./pagination";

describe("parsePageParam", () => {
    it("converts 1-based URL pages to 0-based API pages", () => {
        expect(parsePageParam("1")).toBe(0);
        expect(parsePageParam("12")).toBe(11);
    });

    it.each(["0", "-1", "abc", "1.5", "", "2abc"])("rejects %j", (value) => {
        expect(parsePageParam(value)).toBeNull();
    });
});
