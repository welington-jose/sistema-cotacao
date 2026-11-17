"use client";

import { useState } from "react";
import Icone from "@/components/Icone";

export default function CopyShareLinkButton({ cotacaoId }: { cotacaoId: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    const url = `${window.location.origin}/share/${cotacaoId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copie o link:", url);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <button type="button" onClick={copiar} className="btn btn--outline btn--sm" title="Copiar link para fornecedores">
      <Icone nome={copiado ? "check" : "link"} tamanho={15} />
      {copiado ? "Copiado" : "Link"}
    </button>
  );
}
