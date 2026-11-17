"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthLayout, IconeGoogle } from "@/components/AuthLayout";
import Icone from "@/components/Icone";

function CadastroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jaExisteGoogle = searchParams.get("error") === "google_account_already_exists";

  const [etapa, setEtapa] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(jaExisteGoogle ? "Já existe uma conta com este e-mail do Google." : "");
  const [aviso, setAviso] = useState("");

  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [aceite, setAceite] = useState(false);

  async function cadastrarGoogle() {
    await fetch("/api/auth/google-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "register" }),
    });
    signIn("google", { callbackUrl: "/configuracoes?bemvindo=1" }, { prompt: "select_account" });
  }

  async function chamar(url: string, corpo: object) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(dados.error || "Algo deu errado. Tente novamente.");
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

  const enviarCodigo = (e?: React.FormEvent) => {
    e?.preventDefault();
    executar(async () => {
      const r = await chamar("/api/auth/send-code", { email, type: "REGISTER" });
      setAviso(r.devMode ? "Modo de teste: o código apareceu no terminal do servidor." : "");
      setEtapa(2);
    });
  };

  const verificar = (e: React.FormEvent) => {
    e.preventDefault();
    executar(async () => {
      await chamar("/api/auth/verify-code", { email, code: codigo, type: "REGISTER" });
      setEtapa(3);
    });
  };

  const concluir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aceite) {
      setErro("Para continuar, aceite os termos de uso e a política de privacidade.");
      return;
    }
    executar(async () => {
      await chamar("/api/auth/register", { email, code: codigo, password: senha, name: nome, documento, telefone, nomeEmpresa: empresa });
      const r = await signIn("credentials", { email, password: senha, redirect: false });
      if (r?.error) throw new Error("Conta criada, mas não foi possível entrar. Tente fazer login.");
      router.push("/");
      router.refresh();
    });
  };

  return (
    <AuthLayout>
      <div className="steps-indicator" aria-hidden="true">
        <span className="on" />
        <span className={etapa >= 2 ? "on" : ""} />
        <span className={etapa >= 3 ? "on" : ""} />
      </div>

      <h1 className="auth-card__title">{etapa === 3 ? "Dados da empresa" : "Crie sua conta grátis"}</h1>
      <p className="auth-card__subtitle">
        {etapa === 1 && "7 dias grátis, sem cartão de crédito."}
        {etapa === 2 && (
          <>
            Enviamos um código de 6 dígitos para <strong>{email}</strong>.
          </>
        )}
        {etapa === 3 && "Falta pouco. Estes dados aparecem para os seus fornecedores."}
      </p>

      {erro && (
        <div className="alert alert--error mb-4">
          <Icone nome="alerta" />
          <div>
            {erro}
            {jaExisteGoogle && etapa === 1 && (
              <div className="mt-1">
                <Link href="/login">Fazer login</Link>
              </div>
            )}
          </div>
        </div>
      )}
      {aviso && etapa === 2 && (
        <div className="alert alert--info mb-4">
          <Icone nome="info" /> <div>{aviso}</div>
        </div>
      )}

      {etapa === 1 && (
        <>
          <button type="button" onClick={cadastrarGoogle} className="btn btn-google btn--lg">
            <IconeGoogle /> Cadastrar com Google
          </button>
          <div className="divider">ou com e-mail</div>
          <form onSubmit={enviarCodigo}>
            <div className="field">
              <label className="input-label" htmlFor="email">E-mail de trabalho</label>
              <input className="input-field" id="email" type="email" autoComplete="email" placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={carregando} />
            </div>
            <button type="submit" className="btn btn--lg btn--block" disabled={carregando}>
              {carregando ? <span className="spinner" /> : null} Continuar
            </button>
          </form>
        </>
      )}

      {etapa === 2 && (
        <form onSubmit={verificar}>
          <div className="field">
            <label className="input-label" htmlFor="codigo">Código de verificação</label>
            <input
              className="input-field code-input"
              id="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoFocus
              disabled={carregando}
            />
            <span className="input-hint">Não chegou? Confira a caixa de spam ou promoções.</span>
          </div>
          <button type="submit" className="btn btn--lg btn--block" disabled={carregando || codigo.length !== 6}>
            {carregando ? <span className="spinner" /> : null} Confirmar código
          </button>
          <div className="row mt-4" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEtapa(1)}>
              <Icone nome="setaEsq" tamanho={14} /> Trocar e-mail
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => enviarCodigo()} disabled={carregando}>
              Reenviar código
            </button>
          </div>
        </form>
      )}

      {etapa === 3 && (
        <form onSubmit={concluir}>
          <div className="field">
            <label className="input-label" htmlFor="nome">Seu nome</label>
            <input className="input-field" id="nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} />
          </div>
          <div className="field">
            <label className="input-label" htmlFor="empresa">Nome da empresa</label>
            <input className="input-field" id="empresa" autoComplete="organization" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required maxLength={150} />
          </div>
          <div className="form-row">
            <div className="field">
              <label className="input-label" htmlFor="documento">CNPJ ou CPF</label>
              <input className="input-field" id="documento" inputMode="numeric" value={documento} onChange={(e) => setDocumento(e.target.value)} maxLength={18} />
            </div>
            <div className="field">
              <label className="input-label" htmlFor="telefone">WhatsApp</label>
              <input className="input-field" id="telefone" inputMode="tel" autoComplete="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={16} />
            </div>
          </div>
          <div className="field">
            <label className="input-label" htmlFor="senha">Crie uma senha</label>
            <input className="input-field" id="senha" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={8} />
            <span className="input-hint">Mínimo de 8 caracteres.</span>
          </div>
          <label className="checkbox mb-4" style={{ alignItems: "flex-start" }}>
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
            <span className="text-sm">
              Li e aceito os <Link href="/termos" target="_blank">termos de uso</Link> e a{" "}
              <Link href="/privacidade" target="_blank">política de privacidade</Link>.
            </span>
          </label>
          <button type="submit" className="btn btn--lg btn--block" disabled={carregando}>
            {carregando ? <span className="spinner" /> : null} Criar conta e começar
          </button>
        </form>
      )}

      {etapa === 1 && (
        <p className="text-sm text-center mt-6">
          Já tem conta? <Link href="/login" className="fw-700">Entrar</Link>
        </p>
      )}
      {etapa === 1 && (
        <p className="text-xs text-center text-muted mt-3">
          Ao continuar com o Google, você aceita os <Link href="/termos">termos de uso</Link> e a <Link href="/privacidade">política de privacidade</Link>.
        </p>
      )}
    </AuthLayout>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={null}>
      <CadastroContent />
    </Suspense>
  );
}
