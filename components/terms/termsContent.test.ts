import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import pl from "@/messages/pl.json";

const referencedTitles = {
    pl: { 2: "Operator i kontakt", 13: "Dane osobowe", 15: "Rozwiązanie umowy i usunięcie Konta", 17: "Zmiany Regulaminu" },
    en: { 2: "Operator and contact", 13: "Personal data", 15: "Termination and Account deletion", 17: "Changes to these Terms" },
};

describe("terms sections", () => {
    it.each([
        ["pl", pl],
        ["en", en],
    ] as const)("keeps § numbers used in the text pointing at the right sections (%s)", (locale, messages) => {
        expect(messages.terms.sections).toHaveLength(pl.terms.sections.length);
        for (const [number, title] of Object.entries(referencedTitles[locale])) {
            expect(messages.terms.sections[Number(number) - 1].title).toBe(title);
        }
    });
});
