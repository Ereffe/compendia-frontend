import { describe, expect, it } from "vitest";

import { isValidActionId, MAX_NAME_LENGTH, validateEmail, validateName, validateNewPassword } from "./account";

describe("isValidActionId", () => {
    it("accepts the backend's 25-letter ids", () => {
        expect(isValidActionId("aBcDeFgHiJkLmNoPqRsTuVwXy")).toBe(true);
    });

    it("rejects other shapes", () => {
        expect(isValidActionId("short")).toBe(false);
        expect(isValidActionId("aBcDeFgHiJkLmNoPqRsTuVwX1")).toBe(false);
        expect(isValidActionId("../aBcDeFgHiJkLmNoPqRsTuV")).toBe(false);
    });
});

describe("validateName", () => {
    it("rejects blank and too long names", () => {
        expect(validateName("   ")).toBe("emptyName");
        expect(validateName("a".repeat(MAX_NAME_LENGTH + 1))).toBe("nameTooLong");
    });

    it("rejects an unchanged name after trimming", () => {
        expect(validateName("  Ala ", "Ala")).toBe("sameName");
    });

    it("accepts a new name", () => {
        expect(validateName("Ala Nowak", "Ala")).toBeNull();
    });
});

describe("validateEmail", () => {
    it("rejects malformed addresses", () => {
        expect(validateEmail("ala")).toBe("invalidEmail");
        expect(validateEmail("ala@uni")).toBe("invalidEmail");
    });

    it("rejects the current address regardless of case", () => {
        expect(validateEmail(" Ala@Uni.edu ", "ala@uni.edu")).toBe("sameEmail");
    });

    it("accepts a new address", () => {
        expect(validateEmail("ala@new.edu", "ala@uni.edu")).toBeNull();
    });
});

describe("validateNewPassword", () => {
    it("requires the minimum length and a matching confirmation", () => {
        expect(validateNewPassword("short", "short")).toBe("passwordTooShort");
        expect(validateNewPassword("long-enough", "long-enougH")).toBe("passwordsDoNotMatch");
        expect(validateNewPassword("long-enough", "long-enough")).toBeNull();
    });
});
