"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Credenciais inválidas");
      setIsLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="container animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h2>Entrar</h2>
          <p>Insira suas credenciais corporativas</p>
        </div>

        {error && (
          <div style={{ backgroundColor: "var(--color-error)", color: "white", padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">E-mail corporativo</label>
            <input className="input-field" id="email" type="email" placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="input-label" htmlFor="password">Senha</label>
              <Link href="/recuperar-senha" style={{ fontSize: "0.75rem", color: "var(--color-brand-600)", textDecoration: "none" }}>
                Esqueceu a senha?
              </Link>
            </div>
            <input className="input-field" id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn" style={{ width: "100%", marginTop: "1rem" }} disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", textAlign: "center" }}>
          <button onClick={() => signIn("google", { callbackUrl: "/", prompt: "select_account" })} className="btn btn--outline" style={{ width: "100%", marginBottom: "1rem" }}>
            Entrar com Google
          </button>
          <p style={{ fontSize: "0.875rem" }}>
            Não tem uma conta corporativa?{" "}
            <Link href="/cadastro" style={{ color: "var(--color-brand-600)", fontWeight: "bold", textDecoration: "none" }}>
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
