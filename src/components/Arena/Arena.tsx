import FighterCard from "@/components/FighterCard/FighterCard";
import styles from "./Arena.module.css";
import { Character } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { div } from "framer-motion/client";

export default function Arena({
    left,
    right,
    onLeftWin,
    onRightWin,
    disabled,
    winnerSide,
}: {
    left: Character | null;
    right: Character | null;
    onLeftWin: () => void;
    onRightWin: () => void;
    disabled?: boolean;
    winnerSide?: "left" | "right" | null;
}) {
    if (!left || !right) {
        return;
    }

    const isLeftWinner = winnerSide === "left";
    const isRightWinner = winnerSide === "right";

    const cardVariants = {
        enterLeft: { x: -20, opacity: 0, scale: 0.98 },
        center: { x: 0, opacity: 1, scale: 1 },
        exitLeft: { x: -40, opacity: 0, scale: 0.9 },
        enterRight: { x: 20, opacity: 0, scale: 0.98 },
        exitRight: { x: 40, opacity: 0, scale: 0.9 },
    };

    const pulse = { scale: [1, 1.06, 1], transition: { duration: 0.35 } };

    return (


        <div className={styles.arena}>
            <h1>Choose the Winner</h1>
            <div className={styles.grid}>
                <div className={styles.side}>
                    <button className={styles.winBtn} onClick={onLeftWin} disabled={disabled}>
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.div
                                key={left.id}
                                initial="enterLeft"
                                animate={isLeftWinner ? { ...cardVariants.center, ...pulse } : "center"}
                                exit="exitLeft"
                                variants={cardVariants}
                                transition={{ duration: 0.25 }}
                                layout
                            >
                                <FighterCard
                                    c={left}
                                    rating={(left as any).rating}
                                    wins={(left as any).wins}
                                    losses={(left as any).losses}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </button>
                </div>

                <div className={styles.vs} aria-hidden>
                    VS
                </div>

                <div className={styles.side}>
                    <button className={styles.winBtn} onClick={onRightWin} disabled={disabled}>
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.div
                                key={right.id}
                                initial="enterRight"
                                animate={isRightWinner ? { ...cardVariants.center, ...pulse } : "center"}
                                exit="exitRight"
                                variants={cardVariants}
                                transition={{ duration: 0.25 }}
                                layout
                            >
                                <FighterCard
                                    c={right}
                                    rating={(right as any).rating}
                                    wins={(right as any).wins}
                                    losses={(right as any).losses}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </button>
                </div>
            </div>

        </div>

    );
}
