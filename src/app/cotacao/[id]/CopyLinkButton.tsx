"use client";

import { useEffect, useState, useTransition } from "react";
import Icone from "@/components/Icone";
import { convidarFornecedores } from "../../actions/cotacoes";

export default function CompartilharCotacao({
  cotacaoId,
  numero,
  titulo,
  empresa,
  prazo,
}: {
  cotacaoId: string;
  numero: string;
  titulo: string;
  empresa: string;
  prazo: string | null;
}) {
  const [url, setUrl] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [mostrarEmail, setMostrarEmail] = useState(false);
  const [emails, setEmails] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);
  const [enviando, startEnvio] = useTransition();

  useEffect(() => {
    setUrl(`${window.location.origin}/share/${cotacaoId}`);
  }, [cotacaoId]);

  const textoWhatsapp =
    `Olá! A ${empresa} está fazendo a cotação Nº ${numero} (${titulo}).` +
    (prazo ? ` Prazo para resposta: ${prazo}.` : "") +
    `\n\nPode enviar sua proposta por este link? Não precisa criar conta:\n${url}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copie o link:", url);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function enviarEmails(e: React.FormEvent) {
    e.preventDefault();
    setResultado(null);
    startEnvio(async () => {
      const r = await convidarFornecedores(cotacaoId, emails, mensagem);
      if (r.ok) {
        setResultado({ ok: true, texto: r.mensagem || "Convites enviados." });
        setEmails("");
        setMensagem("");
      } else {
        setResultado({ ok: false, texto: r.erro });
      }
    });
  }

  return (
    <div className="card card--brand">
      <div className="card__header">
        <div>
          <div className="card__title">
            <Icone nome="link" /> Link para os fornecedores
          </div>
          <div className="card__subtitle">Quem receber o link responde sem precisar de conta.</div>
        </div>
      </div>

      <div className="share-box mb-4">
        <code>{url || "carregando..."}</code>
        <button type="button" className="btn btn--sm" onClick={copiar} disabled={!url}>
          <Icone nome={copiado ? "check" : "copiar"} tamanho={15} /> {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>

      <div className="grid-2" style={{ gap: "0.6rem" }}>
        <a
          className="btn btn--whatsapp"
          href={url ? `https://wa.me/?text=${encodeURIComponent(textoWhatsapp)}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!url}
        >
          <Icone nome="whatsapp" /> Enviar no WhatsApp
        </a>
        <button type="button" className="btn btn--outline" onClick={() => setMostrarEmail((v) => !v)} aria-expanded={mostrarEmail}>
          <Icone nome="email" /> Convidar por e-mail
        </button>
      </div>

      {mostrarEmail && (
        <form onSubmit={enviarEmails} className="mt-4 animate-fade-in">
          <div className="field">
            <label className="input-label" htmlFor="emails">E-mails dos fornecedores</label>
            <textarea
              id="emails"
              className="input-field"
              rows={3}
              placeholder={"vendas@fornecedor1.com.br\ncomercial@fornecedor2.com.br"}
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              required
            />
            <span className="input-hint">Um por linha, ou separados por vírgula. Até 30 por vez.</span>
          </div>
          <div className="field">
            <label className="input-label" htmlFor="msg">
              Mensagem <span className="opcional">(opcional)</span>
            </label>
            <input id="msg" className="input-field" placeholder="Ex.: Preciso da entrega até sexta." value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={500} />
          </div>
          <button type="submit" className="btn btn--block" disabled={enviando}>
            {enviando ? <span className="spinner" /> : <Icone nome="enviar" />} Enviar convites
          </button>
        </form>
      )}

      {resultado && (
        <div className={`alert mt-4 ${resultado.ok ? "alert--success" : "alert--error"}`}>
          <Icone nome={resultado.ok ? "checkCirculo" : "alerta"} /> <div>{resultado.texto}</div>
        </div>
      )}
    </div>
  );
}
