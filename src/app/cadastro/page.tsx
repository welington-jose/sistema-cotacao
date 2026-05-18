"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function CadastroPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "REGISTER" }),
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
        body: JSON.stringify({ email, code, type: "REGISTER" }),
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password, name, documento, telefone, nomeEmpresa }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar conta");

      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) throw new Error("Conta criada, mas erro ao fazer login.");

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "450px" }}>
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h2>Criar uma conta</h2>
          <p>
            {step === 1 && "Informe seu e-mail de trabalho para começar."}
            {step === 2 && `Enviamos um código para ${email}`}
            {step === 3 && "Preencha seus dados corporativos para finalizar."}
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
              <input className="input-field" id="email" type="email" placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            <button type="submit" className="btn" style={{ width: "100%" }} disabled={isLoading}>
              {isLoading ? "Enviando..." : "Continuar"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="input-group">
              <label className="input-label" htmlFor="code">Código de verificação (6 dígitos)</label>
              <input className="input-field" id="code" type="text" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required disabled={isLoading} style={{ textAlign: "center", letterSpacing: "0.5em", fontSize: "1.25rem" }} />
            </div>
            <button type="submit" className="btn" style={{ width: "100%", marginBottom: "1rem" }} disabled={isLoading}>
              {isLoading ? "Verificando..." : "Verificar Código"}
            </button>
            <div style={{ textAlign: "center" }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--text-secondary)", textDecoration: "underline", cursor: "pointer" }}>
                Voltar e alterar o e-mail
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label className="input-label" htmlFor="name">Seu Nome</label>
              <input className="input-field" id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="documento">CNPJ ou CPF</label>
              <input className="input-field" id="documento" type="text" value={documento} onChange={(e) => setDocumento(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="nomeEmpresa">Nome da Empresa</label>
              <input className="input-field" id="nomeEmpresa" type="text" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="telefone">Telefone / WhatsApp</label>
              <input className="input-field" id="telefone" type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="password">Crie uma Senha</label>
              <input className="input-field" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" className="btn" style={{ width: "100%" }} disabled={isLoading}>
              {isLoading ? "Finalizando..." : "Concluir Cadastro"}
            </button>
          </form>
        )}

        {step === 1 && (
          <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", textAlign: "center" }}>
            <button onClick={() => signIn("google", { callbackUrl: "/", prompt: "select_account" })} className="btn btn--outline" style={{ width: "100%", marginBottom: "1rem" }}>
              Cadastrar com Google
            </button>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              Se já tiver cadastro com este e-mail, escolha a mesma conta do Google ou acesse o login.
            </p>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              Caso já exista cadastro com este e-mail, use o login para acessar a conta já criada.
            </p>
            <p style={{ fontSize: "0.875rem" }}>
              Já tem uma conta? <Link href="/login" style={{ color: "var(--color-brand-600)", fontWeight: "bold", textDecoration: "none" }}>Faça login</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
