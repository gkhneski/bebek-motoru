"use client";

import { useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResultUrl(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Bitte ein Bild auswählen.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const base64 = await fileToBase64(file);

      const res = await fetch("/api/ultrasound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fehler");
      }
      setResultUrl(data.imageUrl || null);
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Bebek Motoru Demo</h1>
      <p style={{ marginBottom: 24 }}>
        Lade ein Ultraschall- oder Babybild hoch. Das Bild wird an die API
        <code> /api/ultrasound </code> geschickt.
      </p>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: 16 }}
        />
        <div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Wird generiert..." : "Bild generieren"}
          </button>
        </div>
      </form>

      {error && (
        <p style={{ color: "red", marginBottom: 16 }}>
          Fehler: {error}
        </p>
      )}

      {resultUrl && (
        <div>
          <h2>Ergebnis</h2>
          <img
            src={resultUrl}
            alt="Result"
            style={{ maxWidth: "100%", borderRadius: 12 }}
          />
        </div>
      )}
    </main>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
