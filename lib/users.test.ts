import { describe, expect, it } from "vitest";

import { findAuthors, isValidUserId } from "./users";

const ala = { id: "1", name: "Ala Nowak", role: "STUDENT" as const };
const olek = { id: "2", name: "Olek Kowalski", role: "USER" as const };

describe("findAuthors", () => {
    it("lists each matching author once with their article count, sorted by name", () => {
        expect(findAuthors([olek, ala, null, olek], "")).toEqual([
            { ...ala, articleCount: 1 },
            { ...olek, articleCount: 2 },
        ]);
    });

    it("matches part of the name case-insensitively", () => {
        expect(findAuthors([ala, olek], "  KOWAL ")).toEqual([{ ...olek, articleCount: 1 }]);
    });
});

describe("isValidUserId", () => {
    it("accepts a UUID and rejects anything else", () => {
        expect(isValidUserId("3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b")).toBe(true);
        expect(isValidUserId("q2wfWe")).toBe(false);
    });
});
