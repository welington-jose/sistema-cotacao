"use client";

import { useRef, useState, useTransition } from "react";
import { salvarEmpresa, salvarLogo } from "../actions/conta";
import Icone from "@/components/Icone";

type Inicial = { nome: string; email: string; nomeEmpresa: string; documento: string; telefone: string; logo: string | null };

/** Reduz a imagem para no máximo 600×300 e converte para PNG (compatível com o PDF). */
function reduzirImagem(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const escala = Math.min(1, 600 / img.width, 300 / img.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * escala));
        canvas.height = Math.max(1, Math.round(img.height * escala));
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = leitor.result as string;
    };
    leitor.readAsDataURL(arquivo);
  });
}

export default function ConfiguracoesClient({ inicial }: { inicial: Inicial }) {
  const [dados, setDados] = useState(inicial);
  const [logo, setLogo] = useState(inicial.logo);
  const [msgDados, setMsgDados] = useState<{ ok: boolean; texto: string } | null>(null);
  const [msgLogo, setMsgLogo] = useState<{ ok: boolean; texto: string } | null>(null);
  const [salvando, startDados] = useTransition();
  const [salvandoLogo, startLogo] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function campo(nome: keyof Inicial) {
    return {
      value: (dados[nome] as string) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDados((d) => ({ ...d, [nome]: e.target.value })),
    };
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsgDados(null);
    startDados(async () => {
      const r = await salvarEmpresa({ nome: dados.nome, nomeEmpresa: dados.nomeEmpresa, documento: dados.documento, telefone: dados.telefone });
      setMsgDados(r.ok ? { ok: true, texto: r.mensagem || "Salvo." } : { ok: false, texto: r.erro });
    });
  }

  async function escolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setMsgLogo(null);
    if (arquivo.size > 5 * 1024 * 1024) {
      setMsgLogo({ ok: false, texto: "A imagem tem mais de 5 MB." });
      return;
    }
    try {
      const reduzida = await reduzirImagem(arquivo);
      setLogo(reduzida);
      startLogo(async () => {
        const r = await salvarLogo(reduzida);
        setMsgLogo(r.ok ? { ok: true, texto: r.mensagem || "Salvo." } : { ok: false, texto: r.erro });
      });
    } catch (erro) {
      setMsgLogo({ ok: false, texto: erro instanceof Error ? erro.message : "Imagem inválida." });
    }
  }

  function remover() {
    setLogo(null);
    startLogo(async () => {
      const r = await salvarLogo(null);
      setMsgLogo(r.ok ? { ok: true, texto: r.mensagem || "Removida." } : { ok: false, texto: r.erro });
    });
  }

  return (
    <div className="stack">
      <form className="card" onSubmit={salvar}>
        <div className="card__header">
          <div className="card__title">
            <Icone nome="predio" /> Dados da empresa
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="input-label" htmlFor="nomeEmpresa">Nome da empresa *</label>
            <input id="nomeEmpresa" className="input-field" required maxLength={150} {...campo("nomeEmpresa")} />
          </div>
          <div className="field">
            <label className="input-label" htmlFor="documento">CNPJ ou CPF</label>
            <input id="documento" className="input-field" inputMode="numeric" maxLength={18} {...campo("documento")} />
          </div>
          <div className="field">
            <label className="input-label" htmlFor="nome">Seu nome</label>
            <input id="nome" className="input-field" maxLength={120} {...campo("nome")} />
          </div>
          <div className="field">
            <label className="input-label" htmlFor="telefone">Telefone / WhatsApp</label>
            <input id="telefone" className="input-field" inputMode="tel" maxLength={16} {...campo("telefone")} />
          </div>
        </div>
        <div className="field">
          <label className="input-label">E-mail de acesso</label>
          <input className="input-field" value={dados.email} disabled />
          <span className="input-hint">É para este e-mail que enviamos o aviso de cada nova proposta.</span>
        </div>
        <div className="row">
          <button type="submit" className="btn" disabled={salvando}>
            {salvando ? <span className="spinner" /> : <Icone nome="check" />} Salvar dados
          </button>
          {msgDados && <span className={`text-sm ${msgDados.ok ? "text-success" : "text-danger"}`}>{msgDados.texto}</span>}
        </div>
      </form>

      <div className="card">
        <div className="card__header">
          <div>
            <div className="card__title">
              <Icone nome="imagem" /> Logomarca
            </div>
            <div className="card__subtitle">Aparece no topo da página do fornecedor e no PDF do comparativo.</div>
          </div>
        </div>
        <div className="row" style={{ alignItems: "flex-start", gap: "1.5rem" }}>
          <div
            style={{
              width: 180,
              height: 110,
              borderRadius: 12,
              border: "2px dashed var(--border-strong)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Logomarca" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 8 }} />
            ) : (
              <span className="text-sm text-muted">Sem logomarca</span>
            )}
          </div>
          <div className="stack-sm" style={{ flex: 1, minWidth: 220 }}>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={escolherArquivo} className="sr-only" id="logo" />
            <div className="row">
              <button type="button" className="btn" onClick={() => inputRef.current?.click()} disabled={salvandoLogo}>
                {salvandoLogo ? <span className="spinner" /> : <Icone nome="imagem" />} {logo ? "Trocar imagem" : "Enviar imagem"}
              </button>
              {logo && (
                <button type="button" className="btn btn--danger-outline btn--outline" onClick={remover} disabled={salvandoLogo}>
                  Remover
                </button>
              )}
            </div>
            <span className="input-hint">PNG, JPG ou WEBP de até 5 MB. Formato horizontal e fundo transparente ficam melhores.</span>
            {msgLogo && <span className={`text-sm ${msgLogo.ok ? "text-success" : "text-danger"}`}>{msgLogo.texto}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
