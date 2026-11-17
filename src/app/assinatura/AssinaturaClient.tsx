"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assinar, cancelar, simularPagamento } from "../actions/assinatura";
import { formatMoeda } from "@/lib/format";
import Icone from "@/components/Icone";

type Plano = { id: "MENSAL" | "ANUAL"; nome: string; valor: number; valorMes: number; descricao: string };

export default function AssinaturaClient({
  planos,
  descontoAnual,
  planoAtual,
  precisaDocumento,
  modoTeste,
  podeCancelar,
}: {
  planos: Plano[];
  descontoAnual: number;
  planoAtual: "MENSAL" | "ANUAL" | null;
  precisaDocumento: boolean;
  modoTeste: boolean;
  podeCancelar: boolean;
  diasTeste: number;
}) {
  const router = useRouter();
  const [documento, setDocumento] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendente, start] = useTransition();
  const [escolhido, setEscolhido] = useState<string | null>(null);

  function executar(planoId: Plano["id"]) {
    setMsg(null);
    setEscolhido(planoId);
    start(async () => {
      try {
        const r = await assinar(planoId, documento);
        if (r && !r.ok) setMsg({ ok: false, texto: r.erro });
      } catch (e) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        setMsg({ ok: false, texto: "Não foi possível abrir o pagamento. Tente de novo." });
      }
    });
  }

  function simular(planoId: Plano["id"]) {
    start(async () => {
      const r = await simularPagamento(planoId);
      setMsg(r.ok ? { ok: true, texto: r.mensagem || "OK" } : { ok: false, texto: r.erro });
      router.refresh();
    });
  }

  function cancelarAssinatura() {
    if (!confirm("Cancelar a renovação automática? Você continua com acesso até o fim do período já pago.")) return;
    start(async () => {
      const r = await cancelar();
      setMsg(r.ok ? { ok: true, texto: r.mensagem || "Cancelada." } : { ok: false, texto: r.erro });
      router.refresh();
    });
  }

  return (
    <div className="stack">
      {precisaDocumento && (
        <div className="card card--muted">
          <div className="field" style={{ marginBottom: 0, maxWidth: 360 }}>
            <label className="input-label" htmlFor="doc">CPF ou CNPJ para a cobrança</label>
            <input id="doc" className="input-field" inputMode="numeric" placeholder="Somente números" value={documento} onChange={(e) => setDocumento(e.target.value)} maxLength={18} />
            <span className="input-hint">Exigido pelo sistema de pagamento para emitir a cobrança.</span>
          </div>
        </div>
      )}

      <div className="grid-2">
        {planos.map((p) => {
          const destaque = p.id === "ANUAL";
          const atual = planoAtual === p.id;
          return (
            <div key={p.id} className={`price-card ${destaque ? "price-card--featured" : ""}`}>
              {destaque && <span className="price-card__tag">Economize {descontoAnual}%</span>}
              <div className="flex-between">
                <div className="price-card__name">Plano {p.nome}</div>
                {atual && <span className="badge badge--success">Seu plano</span>}
              </div>
              <div className="price-card__price">
                {formatMoeda(p.valorMes)} <small>/mês</small>
              </div>
              <div className="price-card__desc">
                {destaque ? `${formatMoeda(p.valor)} cobrados uma vez por ano.` : "Cobrado todo mês."} {p.descricao}
              </div>
              <ul>
                <li><Icone nome="check" tamanho={16} /> Cotações e fornecedores ilimitados</li>
                <li><Icone nome="check" tamanho={16} /> PDF com sua logomarca</li>
                <li><Icone nome="check" tamanho={16} /> PIX, boleto ou cartão de crédito</li>
              </ul>
              <button type="button" className={`btn btn--lg btn--block ${destaque ? "" : "btn--outline"}`} onClick={() => executar(p.id)} disabled={pendente}>
                {pendente && escolhido === p.id ? <span className="spinner" /> : <Icone nome="cartao" />}
                {atual ? "Ver cobrança" : "Assinar e pagar"}
              </button>
              {modoTeste && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => simular(p.id)} disabled={pendente}>
                  Simular pagamento (só em teste)
                </button>
              )}
            </div>
          );
        })}
      </div>

      {msg && (
        <div className={`alert ${msg.ok ? "alert--success" : "alert--error"}`}>
          <Icone nome={msg.ok ? "checkCirculo" : "alerta"} /> <div>{msg.texto}</div>
        </div>
      )}

      <div className="card card--muted text-sm">
        <div className="row" style={{ alignItems: "flex-start" }}>
          <Icone nome="escudo" />
          <div style={{ flex: 1 }}>
            O pagamento é feito em ambiente seguro do Asaas. Depois de pago, o acesso é liberado automaticamente (PIX e cartão em
            minutos; boleto em até 2 dias úteis). Sem fidelidade: cancele quando quiser.
          </div>
        </div>
        {podeCancelar && (
          <div className="mt-3">
            <button type="button" className="btn btn--ghost btn--sm text-danger" onClick={cancelarAssinatura} disabled={pendente}>
              Cancelar renovação automática
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
