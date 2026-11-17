"use client";

import { useTransition } from "react";
import Icone from "./Icone";
import { duplicarCotacao, excluirCotacao, finishCotacao, reabrirCotacao } from "@/app/actions/cotacoes";

export default function AcoesCotacao({ id, ativa, compacto = false }: { id: string; ativa: boolean; compacto?: boolean }) {
  const [pendente, start] = useTransition();

  function executar(acao: () => Promise<unknown>, confirmacao?: string) {
    if (confirmacao && !confirm(confirmacao)) return;
    start(async () => {
      try {
        await acao();
      } catch (e) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        alert(e instanceof Error ? e.message : "Não foi possível concluir.");
      }
    });
  }

  return (
    <div className="row" style={{ gap: "0.5rem" }}>
      {ativa ? (
        <button
          type="button"
          className="btn btn--outline"
          disabled={pendente}
          onClick={() => executar(() => finishCotacao(id), "Finalizar a cotação? O link deixa de aceitar novas propostas (você pode reabrir depois).")}
        >
          <Icone nome="cadeado" tamanho={16} /> Finalizar
        </button>
      ) : (
        <button type="button" className="btn btn--outline" disabled={pendente} onClick={() => executar(() => reabrirCotacao(id))}>
          <Icone nome="abrir" tamanho={16} /> Reabrir
        </button>
      )}
      <button type="button" className="btn btn--outline" disabled={pendente} onClick={() => executar(() => duplicarCotacao(id))} title="Criar uma nova cotação com os mesmos itens">
        <Icone nome="duplicar" tamanho={16} /> {compacto ? "" : "Repetir cotação"}
      </button>
      <button
        type="button"
        className="btn btn--danger-outline btn--outline"
        disabled={pendente}
        title="Excluir cotação"
        onClick={() => executar(() => excluirCotacao(id), "Excluir esta cotação e todas as propostas recebidas? Isso não pode ser desfeito.")}
      >
        <Icone nome="lixo" tamanho={16} />
      </button>
    </div>
  );
}
