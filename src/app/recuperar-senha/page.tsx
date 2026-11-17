"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import Icone from "@/components/Icone";

export default function RecuperarSenhaPage() {
  const [etapa, setEtapa] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function chamar(url: string, corpo: object) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(dados.error || "Algo deu errado.");
    return dados;
  }

  async function executar(acao: () => Promise<void>) {
    setCarregando(true);
    setErro("");
    try {
      await acao();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-card__title">{etapa === 4 ? "Senha alterada" : "Trocar a senha"}</h1>
      <p className="auth-card__subtitle">
        {etapa === 1 && "Informe o e-mail da sua conta. Enviaremos um código."}
        {etapa === 2 && (
          <>
            Se houver uma conta com <strong>{email}</strong>, enviamos um código de 6 dígitos.
          </>
        )}
        {etapa === 3 && "Crie a nova senha."}
        {etapa === 4 && "Pronto! Agora é só entrar com a nova senha."}
      </p>

      {erro && (
        <div className="alert alert--error mb-4">
          <Icone nome="alerta" /> <div>{erro}</div>
        </div>
      )}
      {aviso && etapa === 2 && (
        <div className="alert alert--info mb-4">
          <Icone nome="info" /> <div>{aviso}</div>
        </div>
      )}

      {etapa === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executar(async () => {
              const r = await chamar("/api/auth/send-code", { email, type: "RESET_PASSWORD" });
              setAviso(r.devMode ? "Modo de teste: o código apareceu no terminal do servidor." : "");
              setEtapa(2);
            });
          }}
        >
          <div className="field">
            <label className="input-label" htmlFor="email">E-mail</label>
            <input className="input-field" id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn--lg btn--block" disabled={carregando}>
            {carregando ? <span className="spinner" /> : null} Enviar código
          </button>
        </form>
      )}

      {etapa === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executar(async () => {
              await chamar("/api/auth/verify-code", { email, code: codigo, type: "RESET_PASSWORD" });
              setEtapa(3);
            });
          }}
        >
          <div className="field">
            <label className="input-label" htmlFor="codigo">Código</label>
            <input className="input-field code-input" id="codigo" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} required autoFocus />
          </div>
          <button type="submit" className="btn btn--lg btn--block" disabled={carregando || codigo.length !== 6}>
            {carregando ? <span className="spinner" /> : null} Confirmar código
          </button>
          <button type="button" className="btn btn--ghost btn--sm mt-4" onClick={() => setEtapa(1)}>
            <Icone nome="setaEsq" tamanho={14} /> Trocar e-mail
          </button>
        </form>
      )}

      {etapa === 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executar(async () => {
              await chamar("/api/auth/reset-password", { email, code: codigo, newPassword: senha });
              setEtapa(4);
            });
          }}
        >
          <div className="field">
            <label className="input-label" htmlFor="senha">Nova senha</label>
            <input className="input-field" id="senha" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={8} />
            <span className="input-hint">Mínimo de 8 caracteres.</span>
          </div>
          <button type="submit" className="btn btn--lg btn--block" disabled={carregando}>
            {carregando ? <span className="spinner" /> : null} Salvar nova senha
          </button>
        </form>
      )}

      {etapa === 4 && (
        <Link href="/login" className="btn btn--lg btn--block">
          Ir para o login
        </Link>
      )}

      {etapa < 4 && (
        <p className="text-sm text-center mt-6">
          Lembrou? <Link href="/login" className="fw-700">Voltar ao login</Link>
        </p>
      )}
    </AuthLayout>
  );
}
