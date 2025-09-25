"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import styles from "./DrawCanvas.module.css";

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[] };

type SavedCharacter = {
    id: string;
    name: string;
    imageDataUrl: string;
    createdAt: string;
};

export default function DrawCanvas({
    onSave,
    saving,
    errorMessage,
    disabled,
    onChangeClearError, // NEW: call this when user edits name to hide error
}: {
    onSave?: (p: { name: string; imageDataUrl: string }) => void;
    saving?: boolean;
    errorMessage?: string | null;
    disabled: boolean;
    onChangeClearError?: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    const CSS_SIZE = 512;

    const [brushSize, setBrushSize] = useState<number>(8);
    const [color, setColor] = useState<string>("white");

    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

    const [charName, setCharName] = useState("");

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        //set size
        canvas.style.width = `${CSS_SIZE}px`;
        canvas.style.height = `${CSS_SIZE}px`;

        //set actual pixel buffer
        const dpr = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = Math.floor(CSS_SIZE * dpr);
        canvas.height = Math.floor(CSS_SIZE * dpr);

        // get 2D context and scale so drawing uses CSS pixels
        const context = canvas.getContext("2d");
        if (!context) return;

        //awlays reset transform before scaling
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(dpr, dpr);

        // round lines look nicer for a drawing app
        context.lineJoin = "round";
        context.lineCap = "round";

        // keep reference
        ctxRef.current = context;

        // clear on init
        context.clearRect(0, 0, CSS_SIZE, CSS_SIZE);
    }, []);

    //helpers
    function getCoords(e: React.PointerEvent<HTMLCanvasElement>) {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function redraw(ctx: CanvasRenderingContext2D, all: Stroke[], inProgress?: Stroke | null) {
        ctx.clearRect(0, 0, CSS_SIZE, CSS_SIZE);

        const drawOne = (s: Stroke) => {
            if (s.points.length === 0) return;
            if (s.points.length === 1) {
                // single click = dot
                const p = s.points[0];
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, s.width / 2, 0, Math.PI * 2);
                ctx.fill();
                return;
            }
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width;
            ctx.beginPath();
            ctx.moveTo(s.points[0].x, s.points[0].y);
            for (let i = 1; i < s.points.length; i++) {
                ctx.lineTo(s.points[i].x, s.points[i].y);
            }
            ctx.stroke();
        };

        for (const s of all) drawOne(s);
        if (inProgress) drawOne(inProgress);
    }

    function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
        if (e.button !== 0 && e.pointerType !== "touch") return;
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!canvas || !ctx) return;

        canvas.setPointerCapture(e.pointerId);
        isDrawingRef.current = true;

        const p = getCoords(e);
        lastPointRef.current = p;

        const newStroke: Stroke = { color, width: brushSize, points: [p] };
        setCurrentStroke(newStroke);

        // show initial dot immediately
        redraw(ctx, strokes, newStroke);
    }

    function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
        if (!isDrawingRef.current) return;
        const ctx = ctxRef.current;
        if (!ctx) return;

        const p = getCoords(e);
        lastPointRef.current = p;

        setCurrentStroke((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, points: [...prev.points, p] };
            redraw(ctx, strokes, updated);
            return updated;
        });
    }

    function onPointerUpOrLeave(e: React.PointerEvent<HTMLCanvasElement>) {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas) canvas.releasePointerCapture(e.pointerId);
        isDrawingRef.current = false;
        lastPointRef.current = null;

        if (!ctx) return;

        setCurrentStroke((prev) => {
            if (!prev) return null;
            const next = [...strokes, prev];
            setStrokes(next);
            redraw(ctx, next, null);
            return null;
        });
    }

    function handleUndo() {
        const ctx = ctxRef.current;
        if (!ctx) return;
        setStrokes((prev) => {
            const next = prev.slice(0, -1);
            redraw(ctx, next, null);
            return next;
        });
    }

    function clearCanvas() {
        const ctx = ctxRef.current;
        if (!ctx) return;
        setStrokes([]);
        setCurrentStroke(null);
        ctx.clearRect(0, 0, CSS_SIZE, CSS_SIZE);
    }

    function handleSave() {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!canvas || !ctx) return;
        const hasInProgress = !!currentStroke && currentStroke.points.length > 0;
        const hasData = strokes.length > 0 || hasInProgress;
        if (!charName.trim() || !hasData) return;

        redraw(ctx, strokes, currentStroke ?? null);

        const dataUrl = canvas.toDataURL("image/png");
        onSave?.({
            name: charName.trim(),
            imageDataUrl: dataUrl,
        });

        setCharName("");
        setStrokes([]);
        setCurrentStroke(null);
        ctx.clearRect(0, 0, CSS_SIZE, CSS_SIZE);
    }

    return (
        <div className={styles.wrapper}>
            {/* toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.brushGroup} role="group" aria-label="Brush size">
                    <button type="button" className={brushSize === 4 ? styles.activeBtn : ""} onClick={() => setBrushSize(4)}>
                        <img className={styles.brushIcon} src="/brush_small.png" alt="" aria-hidden="true" />
                    </button>
                    <button type="button" className={brushSize === 8 ? styles.activeBtn : ""} onClick={() => setBrushSize(8)}>
                        <img className={styles.brushIcon} src="/brush_medium.png" alt="" aria-hidden="true" />
                    </button>
                    <button type="button" className={brushSize === 16 ? styles.activeBtn : ""} onClick={() => setBrushSize(16)}>
                        <img className={styles.brushIcon} src="/brush_large.png" alt="" aria-hidden="true" />
                    </button>
                </div>

                <div className={styles.colors}>
                    <button
                        type="button"
                        aria-label="Accent brush"
                        className={`${styles.colorBtn} ${color === "#71f37aff" ? styles.colorActive : ""}`}
                        onClick={(e) => setColor("#71f37aff")}
                        style={{ backgroundColor: "#71f37aff" }}
                    ></button>
                    <button
                        type="button"
                        aria-label="Accent brush"
                        className={`${styles.colorBtn} ${color === "#f37171ff" ? styles.colorActive : ""}`}
                        onClick={(e) => setColor("#f37171ff")}
                        style={{ backgroundColor: "#f37171ff" }}
                    ></button>
                    <button
                        type="button"
                        aria-label="Accent brush"
                        className={`${styles.colorBtn} ${color === "#797bebff" ? styles.colorActive : ""}`}
                        onClick={(e) => setColor("#797bebff")}
                        style={{ backgroundColor: "#797bebff" }}
                    ></button>
                    <button
                        type="button"
                        aria-label="Black brush"
                        className={`${styles.colorBtn} ${color === "white" ? styles.colorActive : ""}`}
                        onClick={(e) => setColor("white")}
                    ></button>
                </div>

                <div className={styles.undoAndClear}>
                    <button type="button" onClick={handleUndo} disabled={strokes.length === 0}>
                        <img className={styles.btnIcon} src="/undo.png" alt="" aria-hidden="true" />
                    </button>

                    <button type="button" onClick={clearCanvas}>
                        <img className={styles.btnIcon} src="/clear.png" alt="" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* canvas*/}
            <div className={styles.canvasShell}>
                <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                    aria-label="Drawing canvas"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUpOrLeave}
                    onPointerLeave={onPointerUpOrLeave}
                />
            </div>

            {/* name/save */}
            <div className={styles.nameAndSave}>

                {errorMessage ? (
                    <div className={styles.error} role="alert" aria-live="polite">
                        {errorMessage}
                    </div>
                ) : (
                    <>

                        <input
                            className={styles.charName}
                            type="text"
                            maxLength={20}
                            placeholder="Character name"
                            value={charName}
                            onChange={(e) => {
                                setCharName(e.target.value);
                                onChangeClearError?.();
                            }} // clear error when typing
                            aria-label="Character name"
                        />

                        <button
                            className={styles.saveBtn}
                            type="button"
                            onClick={handleSave}
                            disabled={
                                !charName.trim() || (strokes.length === 0 && !(currentStroke && currentStroke.points.length)) || saving
                            }
                        >
                            <img className={styles.brushIcon} src="/save.png" alt="" aria-hidden="true" />
                            {saving ? "Saving…" : "Save"}
                        </button>

                    </>

                )}
            </div>
        </div>
    );
}
