import styles from "./Spinner.module.css";

export default function Spinner({
    size = 24,
    label = "Loading",
}: {
    size?: number;   // px
    label?: string;  // for screen readers
}) {
    return (
        <span className={styles.wrap} role="status" aria-live="polite" aria-label={label}>
            <span
                className={styles.spinner}
                style={{ width: size, height: size }}
                aria-hidden
            />
        </span>
    );
}
