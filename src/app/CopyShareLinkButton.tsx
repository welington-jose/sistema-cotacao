"use client";

import { useEffect, useState } from "react";

export default function CopyShareLinkButton({ cotacaoId }: { cotacaoId: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/share/${cotacaoId}`);
  }, [cotacaoId]);

  const handleCopy = async () => {
    if (!url) return;

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn btn--outline"
      disabled={!url}
      style={{ whiteSpace: "nowrap" }}
    >
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}
