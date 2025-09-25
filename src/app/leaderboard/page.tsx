"use client";
import { useEffect, useState } from "react";

type Row = {
    id: string;
    name: string;
    image_url: string;
    ratings?: { rating: number; wins: number; losses: number } | null;
};

export default function LeaderboardPage() {
    const [rows, setRows] = useState<Row[]>([]);

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/characters");
            if (!res.ok) return;
            const data: Row[] = await res.json();
            setRows(data);
        })();
    }, []);

    const withRatings = rows.map(r => ({
        ...r,
        r: r.ratings ?? { rating: 1000, wins: 0, losses: 0 },
    }));
    const sorted = withRatings.sort((a, b) => (b.r.rating - a.r.rating));

    const top10 = sorted.slice(0, 10);
    const bottom10 = sorted.slice(-10);

    return (
        <div style={{ display: "grid", gap: 16 }}>
            <h1>Leaderboard</h1>

            <section>
                <h2>Top 10</h2>
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
                    {top10.map(r => (
                        <li key={r.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <img src={r.image_url} alt={r.name} width={48} height={48} style={{ borderRadius: 8, objectFit: "cover" }} />
                            <strong style={{ width: 160 }}>{r.name}</strong>
                            <span>⭐ {r.r.rating}</span>
                            <span>W{r.r.wins}–L{r.r.losses}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <h2>Bottom 10</h2>
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
                    {bottom10.map(r => (
                        <li key={r.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <img src={r.image_url} alt={r.name} width={48} height={48} style={{ borderRadius: 8, objectFit: "cover" }} />
                            <strong style={{ width: 160 }}>{r.name}</strong>
                            <span>⭐ {r.r.rating}</span>
                            <span>W{r.r.wins}–L{r.r.losses}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
