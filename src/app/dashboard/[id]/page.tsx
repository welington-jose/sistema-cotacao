import { PrismaClient } from "@prisma/client";
import { finishCotacao } from "../../actions/cotacoes";
import PrintButton from "./PrintButton";

const prisma = new PrismaClient();

export default async function DashboardCotacaoPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  const cotacao = await prisma.cotacao.findUnique({
    where: { id },
    include: {
      itens: {
        include: { produto: true }
      },
      respostas: {
        include: { itens: true }
      }
    }
  });

  if (!cotacao) {
    return <div className="container">Cotação não encontrada.</div>;
  }

  // --- Lógica de Resumo dos Menores Preços ---
  // Para cada item da cotação, queremos encontrar o fornecedor que ofereceu o menor preço final
  type MelhorOfertaType = {
    fornecedor: string;
    marca: string | null;
    precoBruto: number;
    desconto: number;
    precoFinal: number;
    prazo: string | null;
    condicao: string | null;
  };

  const resumosItens = cotacao.itens.map(itemSolicitado => {
    let melhorOferta: MelhorOfertaType | null = null;
    let menorPreco = Infinity;

    cotacao.respostas.forEach(respostaFornecedor => {
      // Find what this supplier answered for this specific item
      const itemRespondido = respostaFornecedor.itens.find(i => i.cotacaoItemId === itemSolicitado.id);
      
      if (itemRespondido && itemRespondido.precoUnitario && itemRespondido.precoUnitario > 0) {
        const precoUn = itemRespondido.precoUnitario;
        const descItem = itemRespondido.descontoItem || 0;
        const precoFinal = Math.max(0, precoUn - descItem);

        if (precoFinal < menorPreco) {
          menorPreco = precoFinal;
          melhorOferta = {
            fornecedor: respostaFornecedor.nomeFornecedor,
            marca: itemRespondido.marca,
            precoBruto: precoUn,
            desconto: descItem,
            precoFinal: precoFinal,
            prazo: respostaFornecedor.prazoEntrega,
            condicao: respostaFornecedor.condicaoPagamento
          };
        }
      }
    });

    return {
      produto: itemSolicitado.produto,
      quantidade: itemSolicitado.quantidade,
      marca: itemSolicitado.marca,
      melhorOferta: melhorOferta as MelhorOfertaType | null
    };
  });

  return (
    <div className="container animate-fade-in">
      <div className="flex-between mb-8">
        <div>
          <h1>Cotação: {cotacao.titulo}</h1>
          <p>Análise comparativa das respostas cadastradas pelos {cotacao.respostas.length} fornecedores.</p>
        </div>
        
        <div className="no-print" style={{ display: "flex", gap: "1rem" }}>
          <PrintButton />
          
          {cotacao.ativa && (
            <form action={async () => {
              "use server";
              await finishCotacao(cotacao.id);
            }}>
              <button type="submit" className="btn btn--danger">Finalizar Cotação (Fechar Link)</button>
            </form>
          )}
        </div>
      </div>

      <div className="glass-panel mb-8">
        <h2>🏆 Tabela de Resumo (Menores Preços por Item)</h2>
        <div className="table-wrapper mt-4">
          <table className="data-table">
            <thead>
              <tr style={{ backgroundColor: "var(--color-brand-50)" }}>
                <th>Material Solicitado</th>
                <th>Qtd</th>
                <th>Fornecedor Vencedor</th>
                <th>Marca Vencedora</th>
                <th>Detalhes (Prazo/Pag.)</th>
                <th style={{ textAlign: "right" }}>Melhor Valor (Un)</th>
                <th style={{ textAlign: "right" }}>Total Bruto</th>
              </tr>
            </thead>
            <tbody>
              {resumosItens.map((resumo, idx) => (
                <tr key={idx}>
                  <td>
                    <span style={{ fontWeight: 500 }}>{resumo.produto.nome}</span>
                    {resumo.marca && <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Marca desejada: {resumo.marca}</div>}
                  </td>
                  <td>{resumo.quantidade} {resumo.produto.unidade}</td>
                  
                  {resumo.melhorOferta ? (
                    <>
                      <td style={{ color: "var(--color-brand-600)", fontWeight: "bold" }}>{resumo.melhorOferta.fornecedor}</td>
                      <td>{resumo.melhorOferta.marca || "-"}</td>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Prazo: {resumo.melhorOferta.prazo || "-"} <br/>
                        Pag: {resumo.melhorOferta.condicao || "-"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {resumo.melhorOferta.desconto > 0 && (
                           <span style={{ textDecoration: "line-through", color: "var(--color-error)", fontSize: "0.8rem", display: "block" }}>
                             R$ {resumo.melhorOferta.precoBruto.toFixed(2)}
                           </span>
                        )}
                        <span style={{ fontWeight: "bold", color: "var(--color-success)" }}>
                          R$ {resumo.melhorOferta.precoFinal.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "bold" }}>
                         R$ {(resumo.melhorOferta.precoFinal * resumo.quantidade).toFixed(2)}
                      </td>
                    </>
                  ) : (
                    <td colSpan={5} style={{ color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center" }}>
                      Nenhuma oferta válida para este item.
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel print-matrix-panel">
        <h2>📊 Tabela Completa (Por Fornecedor)</h2>
        <div style={{ overflowX: "auto", paddingBottom: "1rem" }} className="mt-4 table-wrapper-print">
          <table className="data-table matrix-table">
            <thead>
              <tr>
                <th style={{ position: "sticky", left: 0, backgroundColor: "var(--bg-primary)", zIndex: 1, borderRight: "2px solid var(--border-color)" }}>
                  Item / Fornecedor
                </th>
                {cotacao.respostas.map(fornecedor => (
                  <th key={fornecedor.id} style={{ textAlign: "center", borderLeft: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "1.1rem", color: "var(--color-brand-600)" }}>{fornecedor.nomeFornecedor}</div>
                    <div style={{ fontSize: "0.75rem", fontWeight: "normal", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      Prazo: {fornecedor.prazoEntrega || "-"} | Pag: {fornecedor.condicaoPagamento || "-"}
                      <br/>
                      {fornecedor.descontoGlobal && fornecedor.descontoGlobal > 0 ? (
                        <span style={{ color: "var(--color-success)", fontWeight: "bold" }}>
                          Desconto Global: R$ {fornecedor.descontoGlobal.toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cotacao.itens.map(itemS => (
                <tr key={itemS.id}>
                  <td style={{ position: "sticky", left: 0, backgroundColor: "var(--bg-surface)", zIndex: 1, borderRight: "2px solid var(--border-color)" }}>
                    <div style={{ fontWeight: 500 }}>{itemS.produto.nome}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{itemS.quantidade} {itemS.produto.unidade}</div>
                    {itemS.marca && <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Desejada: {itemS.marca}</div>}
                  </td>
                  {cotacao.respostas.map(fornecedor => {
                    const respItem = fornecedor.itens.find(i => i.cotacaoItemId === itemS.id);
                    if (!respItem || (respItem.precoUnitario === null || respItem.precoUnitario === 0)) {
                      return (
                         <td key={fornecedor.id} style={{ textAlign: "center", borderLeft: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                           -
                         </td>
                      );
                    }
                    
                    const pFinal = Math.max(0, respItem.precoUnitario - (respItem.descontoItem || 0));

                    return (
                      <td key={fornecedor.id} style={{ textAlign: "center", borderLeft: "1px solid var(--border-color)" }}>
                        <div style={{ fontSize: "0.85rem" }}>Marca: {respItem.marca || "-"}</div>
                        <div style={{ fontWeight: "bold", marginTop: "0.25rem" }}>
                          R$ {pFinal.toFixed(2)}
                        </div>
                        {respItem.descontoItem! > 0 && (
                          <div style={{ fontSize: "0.75rem", color: "var(--color-error)" }}>
                            (R$ {respItem.precoUnitario.toFixed(2)} - Desc: R$ {respItem.descontoItem!.toFixed(2)})
                          </div>
                        )}
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                           Total: R$ {(pFinal * itemS.quantidade).toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
