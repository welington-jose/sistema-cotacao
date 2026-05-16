"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RecuperarSenhaPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar código");
      setStep(2);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, type: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido");
      setStep(3);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao redefinir senha");

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
          <h2>Senha Alterada!</h2>
          <p>Sua senha foi redefinida com sucesso. Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h2>Recuperar Senha</h2>
          <p>
            {step === 1 && "Informe seu e-mail para receber o código."}
            {step === 2 && `Enviamos um código para ${email}`}
            {step === 3 && "Crie uma nova senha."}
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: "var(--color-error)", color: "white", padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">E-mail corporativo</label>
              <input className="input-field" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            <button type="submit" className="btn" style={{ width: "100%" }} disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Código"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="input-group">
              <label className="input-label" htmlFor="code">Código (6 dígitos)</label>
              <input className="input-field" id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required disabled={isLoading} style={{ textAlign: "center", letterSpacing: "0.5em", fontSize: "1.25rem" }} />
            </div>
            <button type="submit" className="btn" style={{ width: "100%" }} disabled={isLoading}>
              {isLoading ? "Verificando..." : "Verificar Código"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="input-group">
              <label className="input-label" htmlFor="password">Nova Senha</label>
              <input className="input-field" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={isLoading} />
            </div>
            <button type="submit" className="btn" style={{ width: "100%" }} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Redefinir Senha"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem" }}>
            Lembrou sua senha?{" "}
            <Link href="/login" style={{ color: "var(--color-brand-600)", fontWeight: "bold", textDecoration: "none" }}>
              Voltar ao Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
