import { Character } from "@/types";
import styles from "./FighterCard.module.css";

export default function FighterCard({
    c,
    rating,
    wins,
    losses,
}: {
    c: Character;
    rating?: number;
    wins?: number;
    losses?: number;
}) {
    const initials = c.name.slice(0, 2).toUpperCase();

    return (
        <article className={styles.card} aria-label={`Fighter ${c.name}`}>
            {c.imageUrl ? (
                <img className={styles.thumb} src={c.imageUrl} alt={c.name} />
            ) : (
                <div className={styles.placeholder} aria-hidden>
                    {initials}
                </div>
            )}
            <div className={styles.meta}>
                <strong className={styles.name}>{c.name}</strong>
                {rating != null && (
                    <div className={styles.badges}>
                        <span title="Rating">ELO: {rating}</span>
                        <span title="Record">W {wins ?? 0} – L {losses ?? 0}</span>
                    </div>
                )}
            </div>
        </article>
    );
}
