"use client";

import { useState, useEffect } from "react";

export default function ConfiguracoesPage() {
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user/logo")
      .then(res => res.json())
      .then(data => {
        if (data.logoBase64) setLogoBase64(data.logoBase64);
      })
      .catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem não pode ter mais de 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!logoBase64) return;
    
    setIsLoading(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/user/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoBase64 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar a logomarca.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setLogoBase64(null);
    setIsLoading(true);
    
    try {
      await fetch("/api/user/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoBase64: null }),
      });
      setSuccess(true);
    } catch {
      setError("Erro ao remover a logo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="container animate-fade-in" style={{ paddingTop: "2rem" }}>
        <h1>Configurações da Empresa</h1>
        <p className="mb-8 text-secondary">Gerencie as informações da sua empresa e como elas aparecem para os seus fornecedores.</p>

        <div className="glass-panel" style={{ maxWidth: "600px" }}>
          <h2>Logomarca</h2>
          <p className="text-secondary" style={{ marginBottom: "1.5rem" }}>
            Esta imagem aparecerá no topo do portal do fornecedor quando você compartilhar o link da cotação.
          </p>

          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div 
              style={{ 
                width: "150px", 
                height: "150px", 
                borderRadius: "8px", 
                border: "2px dashed var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                backgroundColor: "var(--bg-surface)",
                position: "relative"
              }}
            >
              {logoBase64 ? (
                <img src={logoBase64} alt="Logomarca" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textAlign: "center", padding: "1rem" }}>
                  Sem imagem
                </span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: "250px" }}>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={handleFileChange}
                style={{ marginBottom: "1rem", display: "block" }}
                id="logo-upload"
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                Recomendado: Formato quadrado ou horizontal. Máx 2MB (PNG, JPG).
              </p>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button 
                  className="btn" 
                  onClick={handleSave} 
                  disabled={isLoading || !logoBase64}
                >
                  {isLoading ? "Salvando..." : "Salvar Logomarca"}
                </button>
                {logoBase64 && (
                  <button 
                    className="btn btn--danger" 
                    onClick={handleRemove}
                    disabled={isLoading}
                  >
                    Remover
                  </button>
                )}
              </div>

              {error && <p style={{ color: "var(--color-error)", marginTop: "1rem", fontSize: "0.875rem" }}>{error}</p>}
              {success && <p style={{ color: "var(--color-success)", marginTop: "1rem", fontSize: "0.875rem" }}>Alterações salvas com sucesso!</p>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
