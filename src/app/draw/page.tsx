"use client";
import React, { useState, useEffect } from "react";
import DrawCanvas from "@/components/DrawCanvas/DrawCanvas";
import styles from "./Draw.module.css";

type SavedCharacter = {
    id: string;
    name: string;
    imageDataUrl: string;
    createdAt: string;
};

export default function DrawPage() {
    const [saved, setSaved] = useState<SavedCharacter[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        const ctrl = new AbortController();
        (async () => {
            try {
                const res = await fetch("/api/quota", { signal: ctrl.signal, cache: "no-store" });
                if (res.ok) {
                    const { remaining } = await res.json();
                    if (remaining <= 0) setSaveError("Daily submission limit reached");
                }
            } catch (e: any) {
                if (e?.name !== "AbortError") console.error("Failed to fetch quota", e);
            }
        })();
        return () => ctrl.abort();
    }, []);

    async function handleSave({ name, imageDataUrl }: { name: string; imageDataUrl: string }) {
        if (saveError) return;
        const trimmed = (name ?? "").trim();
        if (!trimmed) {
            setSaveError("Name is required");
            return;
        }
        if (trimmed.length > 20) {
            setSaveError("Name too long (max 20)");
            return;
        }

        setSaveError(null);
        try {
            setSaving(true);
            const res = await fetch("/api/characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed, imageDataUrl }),
            });

            if (!res.ok) {
                const text = await res.text();
                let body: any = {};
                try {
                    body = JSON.parse(text);
                } catch { }
                if (res.status === 429 && body?.error) {
                    setSaveError(body.error);
                    return;
                }
                setSaveError(body?.error || `Save failed (${res.status})`);
                return;
            }

            const row = await res.json();
            setSaved((prev) => [
                { id: row.id, name: row.name, imageDataUrl: row.image_url, createdAt: row.created_at },
                ...prev,
            ]);
        } catch (e: any) {
            setSaveError(e.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.drawContent}>
            <h1>Draw a character</h1>
            <DrawCanvas
                onSave={handleSave}
                saving={saving}
                errorMessage={saveError}
                disabled={saving || !!saveError}
                onChangeClearError={() => setSaveError(null)}
            />
            <section className={styles.savedDoodles}>
                <h2>Saved</h2>
                {saved.length === 0 ? (
                    <p>Nothing saved yet in this session.</p>
                ) : (
                    <ul>
                        {saved.map((c) => (
                            <li key={c.id}>
                                <img src={c.imageDataUrl} alt={`${c.name} preview`} />
                                <div>
                                    <strong>{c.name}</strong>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
