"use client";

import { useEffect, useMemo, useState } from "react";
import { Character } from "@/types";
import Arena from "@/components/Arena/Arena";
import { RatingRow } from "@/lib/elo";

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function FightPage() {
    const [pool, setPool] = useState<Character[]>([]);
    const [left, setLeft] = useState<Character | null>(null);
    const [right, setRight] = useState<Character | null>(null);
    const [queue, setQueue] = useState<Character[]>([]);
    const [done, setDone] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);


    const [ratings, setRatings] = useState<Map<string, RatingRow>>(new Map());

    const [isAnimating, setIsAnimating] = useState(false);
    const [winnerSide, setWinnerSide] = useState<"left" | "right" | null>(null);
    useEffect(() => {
        (async () => {
            const res = await fetch("/api/characters");
            if (!res.ok) {
                console.error("Failed to load characters");
                return;
            }
            const rows: {
                id: string;
                name: string;
                image_url: string;
                ratings?: { rating: number; wins: number; losses: number } | null;
            }[] = await res.json();

            const pool = rows.map((char) => ({
                id: char.id,
                name: char.name,
                imageUrl: char.image_url,
            }));

            setRatings(() => {
                const m = new Map<string, { rating: number; wins: number; losses: number }>();
                for (const r of rows) {
                    const rr = r.ratings ?? { rating: 1000, wins: 0, losses: 0 };
                    m.set(r.id, { rating: rr.rating, wins: rr.wins, losses: rr.losses });
                }
                return m;
            });

            const shuffled = shuffle(pool);
            const [a, b, ...rest] = shuffled;
            setPool(shuffled);
            setLeft(a ?? null);
            setRight(b ?? null);
            setQueue(rest);
            setDone(a == null || b == null);
        })();
    }, []);

    // const notEnough = useMemo(() => pool.length < 2, [pool]);

    function nextChallenger(): Character | null {
        if (queue.length === 0) return null;
        const [next, ...rest] = queue;
        setQueue(rest);
        return next ?? null;
    }

    async function recordFight(winner: Character, loser: Character) {
        const res = await fetch("/api/fight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ winnerId: winner.id, loserId: loser.id }),
        });
        if (!res.ok) {
            const msg = await res.json().catch(() => ({}));
            setErrorMessage(msg.error || "Something went wrong.");
            return;
        }
        const data = await res.json();
        // Update local UI immediately from server response (no extra fetch)
        setRatings((prev) => {
            const m = new Map(prev);
            const w = m.get(data.winner.id) ?? { rating: 1000, wins: 0, losses: 0 };
            const l = m.get(data.loser.id) ?? { rating: 1000, wins: 0, losses: 0 };
            w.rating = data.winner.rating;
            w.wins = data.winner.wins;
            w.losses = data.winner.losses;
            l.rating = data.loser.rating;
            l.wins = data.loser.wins;
            l.losses = data.loser.losses;
            m.set(data.winner.id, w);
            m.set(data.loser.id, l);
            return m;
        });
    }

    function animateAndRotate(doRotate: () => void, side: "left" | "right") {
        setIsAnimating(true);
        setWinnerSide(side);
        setTimeout(() => {
            doRotate();
            setWinnerSide(null);
            setIsAnimating(false);
        }, 300);
    }

    function handleLeftWins() {
        if (!left || !right || isAnimating) return;
        recordFight(left, right);

        animateAndRotate(() => {
            const challenger = nextChallenger();
            if (!challenger) {
                setDone(true);
                return;
            }
            setRight(challenger); // left stays
        }, "left");
    }

    function handleRightWins() {
        if (!left || !right || isAnimating) return;
        recordFight(right, left);

        animateAndRotate(() => {
            const challenger = nextChallenger();
            if (!challenger) {
                setDone(true);
                return;
            }
            setLeft(challenger); // right stays
        }, "right");
    }

    // if (notEnough) {
    //     return (
    //         <div className='centeredContainer'>
    //             <p>Not enough fighters — draw more on the Draw page.</p>
    //         </div>
    //     );
    // }

    const leftStats = left ? ratings.get(left.id) : undefined;
    const rightStats = right ? ratings.get(right.id) : undefined;

    return (
        <div className="centeredContainer">
            {errorMessage ? (
                <p style={{ color: "red", marginBottom: "1rem" }}>
                    {/* {errorMessage} */}
                </p>
            ) : done ? (
                <p>Run complete — no more challengers.</p>
            ) : (
                <Arena
                    leftChar={left ? ({ ...left, ...(leftStats ?? {}) } as any) : null}
                    rightChar={right ? ({ ...right, ...(rightStats ?? {}) } as any) : null}
                    onLeftWin={handleLeftWins}
                    onRightWin={handleRightWins}
                    disabled={isAnimating}
                    winnerSide={winnerSide}
                />
            )}
        </div>
    );
}
