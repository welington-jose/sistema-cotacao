"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout, IconeGoogle } from "@/components/AuthLayout";
import Icone from "@/components/Icone";

function mensagemErro(codigo: string | null) {
  if (!codigo) return null;
  if (codigo === "google_account_not_found") return { texto: "Não encontramos uma conta com este e-mail do Google.", cadastro: true };
  if (codigo === "google_email_not_found") return { texto: "O Google não informou o e-mail. Tente de novo ou entre com e-mail e senha.", cadastro: false };
  if (codigo === "OAuthAccountNotLinked") return { texto: "Este e-mail já tem cadastro com senha. Entre com e-mail e senha.", cadastro: false };
  return { texto: "Não foi possível entrar com o Google. Tente novamente.", cadastro: false };
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const erroGoogle = mensagemErro(searchParams.get("error"));
  const destino = searchParams.get("callbackUrl") || "/";

  async function entrarGoogle() {
    await fetch("/api/auth/google-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "login" }),
    });
    signIn("google", { callbackUrl: destino }, { prompt: "select_account" });
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    const res = await signIn("credentials", { redirect: false, email, password });
    if (res?.error) {
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
    } else {
      router.push(destino);
      router.refresh();
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-card__title">Entrar</h1>
      <p className="auth-card__subtitle">Bem-vindo de volta. Acesse suas cotações.</p>

      {(erro || erroGoogle) && (
        <div className="alert alert--error mb-4">
          <Icone nome="alerta" />
          <div>
            {erro || erroGoogle?.texto}
            {!erro && erroGoogle?.cadastro && (
              <div className="mt-1">
                <Link href="/cadastro">Criar uma conta grátis</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <button type="button" onClick={entrarGoogle} className="btn btn-google btn--lg">
        <IconeGoogle /> Entrar com Google
      </button>

      <div className="divider">ou com e-mail</div>

      <form onSubmit={entrar}>
        <div className="field">
          <label className="input-label" htmlFor="email">E-mail</label>
          <input className="input-field" id="email" type="email" autoComplete="email" placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <div className="flex-between">
            <label className="input-label" htmlFor="password">Senha</label>
            <Link href="/recuperar-senha" className="text-xs fw-600">Esqueci a senha</Link>
          </div>
          <input className="input-field" id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn--lg btn--block mt-2" disabled={carregando}>
          {carregando ? <span className="spinner" /> : null} Entrar
        </button>
      </form>

      <p className="text-sm text-center mt-6">
        Ainda não tem conta? <Link href="/cadastro" className="fw-700">Teste grátis</Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
