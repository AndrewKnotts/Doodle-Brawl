"use client";
import { useEffect, useState } from "react";
import styles from "./LeaderboardPage.module.css";

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

    const withRatings = rows.map((r) => ({
        ...r,
        r: r.ratings ?? { rating: 1000, wins: 0, losses: 0 },
    }));

    const sorted = withRatings.sort((a, b) => b.r.rating - a.r.rating);

    const top10 = sorted.slice(0, 10);
    const bottom10 = sorted.slice(-10);

    return (
        <div className={styles.container}>
            <h1>Leaderboard</h1>

            <section>
                <ul>
                    {top10.map((char, index) => (
                        <li key={char.id}>
                            <span className={styles.rank}>#{index + 1}</span>
                            <img src={char.image_url} alt={char.name} />
                            <div className={styles.charDetails}>
                                <strong>{char.name}</strong>
                                <span>ELO:  {char.r.rating}</span>
                                <span>
                                    W {char.r.wins} – L {char.r.losses}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            {/* <section>
                <h2>Bottom 10</h2>
                <ul>
                    {bottom10.map(r => (
                        <li key={r.id} >
                            <img src={r.image_url} alt={r.name} width={48} height={48} />
                            <strong >{r.name}</strong>
                            <span>{r.r.rating}</span>
                            <span>W{r.r.wins}–L{r.r.losses}</span>
                        </li>
                    ))}
                </ul>
            </section> */}
        </div>
    );
}
