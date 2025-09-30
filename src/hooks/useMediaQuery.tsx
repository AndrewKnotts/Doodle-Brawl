import { useEffect, useState } from "react";

export default function useMediaQuery(query: any) {
    const [matches, setMatches] = useState(() =>
        window.matchMedia(query).matches
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handler = (e: any) => setMatches(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, [query]);

    return matches;
}