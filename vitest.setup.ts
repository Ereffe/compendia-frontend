import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia; components such as useIsMobile need it. Defaults to "desktop" (no match).
if (!globalThis.matchMedia) {
    globalThis.matchMedia = (query: string) =>
        ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
        }) as MediaQueryList;
}
