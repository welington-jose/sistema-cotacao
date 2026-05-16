"use client";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="btn btn--outline" 
      style={{ marginRight: "1rem" }}
    >
      🖨️ Imprimir Resumo
    </button>
  );
}
