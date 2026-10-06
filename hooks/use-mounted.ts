import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` during server rendering and hydration, `true` afterwards.
 *
 * Use it to gate output that depends on browser-only state (e.g. next-themes' `resolvedTheme`, which is
 * `undefined` on the server). React uses the server snapshot while hydrating, so the first client render
 * matches the server HTML and there's no hydration mismatch. Unlike `useEffect(() => setMounted(true))`,
 * this doesn't set state in an effect (a React Compiler lint error).
 */
export function useMounted(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
}
