import Spinner from "@/components/Spinner/Spinner";

export default function Loading() {
    return (
        <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
            <Spinner size={64} label="Loading page…" />
        </div>
    );
}