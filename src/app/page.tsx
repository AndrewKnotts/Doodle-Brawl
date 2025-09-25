"use client";

import { useEffect, useState } from "react";
import styles from "./Home.module.css";
import Link from "next/link";
import Spinner from "@/components/Spinner/Spinner";

type CharacterRow = {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
  ratings?: { rating: number; wins: number; losses: number } | null;
};

export default function HomePage() {
  const [mine, setMine] = useState<CharacterRow[]>([]);
  const [top, setTop] = useState<CharacterRow | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    (async () => {
      try {
        const [myRes, topRes] = await Promise.all([fetch("/api/my-characters"), fetch("/api/top-character")]);

        const myData = myRes.ok ? await myRes.json() : [];
        const topData = topRes.ok ? await topRes.json() : null;

        setMine(myData);
        setTop(topData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const normalizedMine = mine.map((r) => ({
    ...r,
    r: r.ratings ?? { rating: 1000, wins: 0, losses: 0 },
  }));

  return (
    <div className={styles.landingContent}>
      {/* crown */}
      <img className={styles.crown} src="/crown.svg" alt="" aria-hidden="true" />
      {/* Top character */}
      {top ? (
        <img className={styles.landingChar} src={top.image_url} alt={top.name} />
      ) : loading ? (
        <div style={{ display: "grid", placeItems: "center", minHeight: 200 }}>
          <Spinner size={52} />
        </div>
      ) : (
        <p>No fighters yet.</p>
      )}

      <h1 className={styles.landingTitle}>Doodle Battle</h1>

      <div className={styles.homeBtnList}>
        <Link className={styles.homeBtn} href="/draw">
          <img className={styles.btnIcon} src="/draw.png" alt="" aria-hidden="true" />
          <span>Draw</span>
        </Link>
        <Link className={styles.homeBtn} href="/fight">
          <img className={styles.btnIcon} src="/battle.png" alt="" aria-hidden="true" /> <span>Battle</span>
        </Link>
        <Link className={styles.homeBtn} href="/leaderboard">
          <img className={styles.btnIcon} src="/leaderboard.png" alt="" aria-hidden="true" /> <span>Leaderboard</span>
        </Link>
      </div>

      {/* Your characters */}
      <section className={styles.yourDoodles}>
        <h2>Your Doodles</h2>
        {normalizedMine.length === 0 ? (
          loading ? (
            <div style={{ display: "grid", placeItems: "center", minHeight: 20 }}>
              <Spinner size={52} />
            </div>
          ) : (
            <p>You haven’t saved any characters from this device/IP yet.</p>
          )
        ) : (
          <ul>
            {normalizedMine
              .sort((a, b) => b.r.rating - a.r.rating)
              .map((r) => (
                <li key={r.id}>
                  <div className={styles.doodleSmall}>
                    <img src={r.image_url} alt={r.name} />
                    <strong>{r.name}</strong>
                  </div>
                  <span className={styles.doodleSmallStats}>
                    <div>ELO: {r.r.rating}</div>
                    <div>
                      W {r.r.wins} – L {r.r.losses}
                    </div>
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
