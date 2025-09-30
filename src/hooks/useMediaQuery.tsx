"use client";

import { useEffect, useState } from "react";

export default function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false); // default safe for SSR

    useEffect(() => {
        if (typeof window === "undefined") return; // guard for SSR
        const mediaQuery = window.matchMedia(query);

        // set initial value
        setMatches(mediaQuery.matches);

        // watch for changes
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mediaQuery.addEventListener("change", handler);

        return () => mediaQuery.removeEventListener("change", handler);
    }, [query]);

    return matches;
}
