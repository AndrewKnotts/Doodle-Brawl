"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import DrawCanvas from "@/components/DrawCanvas/DrawCanvas";

type SavedCharacter = {
    id: string;
    name: string;
    imageDataUrl: string;
    createdAt: string;
};

export default function DrawPage() {
    const [saved, setSaved] = useState<SavedCharacter[]>([]);
    const [saving, setSaving] = useState(false);

    async function handleSave({ name, imageDataUrl }: { name: string; imageDataUrl: string }) {
        try {
            setSaving(true);
            const res = await fetch("/api/characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, imageDataUrl }),
            });
            if (!res.ok) {
                console.error("Save failed");
                return;
            }
            const row = await res.json();
            // row has: id, name, image_url, created_at
            setSaved((prev) => [
                {
                    id: row.id,
                    name: row.name,
                    imageDataUrl: row.image_url, // use server’s URL, not local dataURL
                    createdAt: row.created_at,
                },
                ...prev,
            ]);
            toast.success("Character saved!");
        } catch (e: any) {
            toast.error(e.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <h1>Draw a character</h1>
            <DrawCanvas onSave={handleSave} />

            {saved.length > 0 && (
                <section>
                    <h2>Saved characters</h2>
                    <ul>
                        {saved.map((c) => (
                            <li key={c.id}>
                                <img src={c.imageDataUrl} alt={`${c.name} preview`} width={96} height={96} />
                                <div>
                                    <strong>{c.name}</strong>
                                    <div style={{ color: "#888", fontSize: 12 }}>{new Date(c.createdAt).toLocaleString()}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
