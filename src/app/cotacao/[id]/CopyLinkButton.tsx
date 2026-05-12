"use client";

import { useState, useEffect } from "react";

export default function CopyLinkButton({ cotacaoId }: { cotacaoId: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/share/${cotacaoId}`);
  }, [cotacaoId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!url) return null;

  return (
    <div className="glass-panel text-center animate-fade-in" style={{ backgroundColor: "var(--color-brand-50)" }}>
      <h3>Link de Compartilhamento</h3>
      <p className="mb-4">Envie este link para os fornecedores preencherem a cotação.</p>
      
      <div className="flex-between" style={{ backgroundColor: "var(--bg-surface)", padding: "0.5rem 1rem", borderRadius: "100px", border: "1px solid var(--color-brand-100)" }}>
        <span style={{ fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left", marginRight: "1rem", color: "var(--color-brand-600)" }}>
          {url}
        </span>
        <button onClick={handleCopy} className="btn" style={{ borderRadius: "100px", flexShrink: 0 }}>
          {copied ? "Copiado!" : "Copiar Link"}
        </button>
      </div>
    </div>
  );
}
