import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { analisarCotacao, carregarCotacaoDoUsuario } from "@/lib/analise";
import {
  formatCotacaoNumero,
  formatData,
  formatDataHora,
  formatDocumento,
  formatMoeda,
  formatNumero,
  formatTelefone,
  linkWhatsapp,
} from "@/lib/format";
import Icone from "@/components/Icone";
import AcoesCotacao from "@/components/AcoesCotacao";

export const metadata = { title: "Comparativo" };

export default async function DashboardCotacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await exigirAcesso();
  const cotacao = await carregarCotacaoDoUsuario(id, user.id);
  if (!cotacao) notFound();

  const analise = analisarCotacao(cotacao);
  const numero = formatCotacaoNumero(cotacao.numero);
  const empresa = user.nomeEmpresa || user.name || "";
  const temRespostas = cotacao.respostas.length > 0;

  return (
    <div className="container container--wide animate-fade-in">
      <div className="breadcrumb">
        <Link href="/">Cotações</Link> <span>/</span> <Link href={`/cotacao/${cotacao.id}`}>Nº {numero}</Link> <span>/</span> <span>Comparativo</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-header__eyebrow">Cotação Nº {numero}</div>
          <h1 className="page-header__title">{cotacao.titulo}</h1>
          <div className="row mt-2">
            {cotacao.ativa ? (
              <span className="badge badge--success badge--dot">Recebendo propostas</span>
            ) : (
              <span className="badge badge--dot">Finalizada</span>
            )}
            <span className="text-sm text-muted">
              {cotacao.respostas.length} proposta(s) · {cotacao.itens.length} item(ns) · criada em {formatData(cotacao.createdAt)}
            </span>
          </div>
        </div>
        <div className="row no-print">
          {temRespostas && (
            <a href={`/api/cotacoes/${cotacao.id}/pdf`} className="btn">
              <Icone nome="baixar" tamanho={16} /> Baixar PDF
            </a>
          )}
          <Link href={`/cotacao/${cotacao.id}`} className="btn btn--outline">
            <Icone nome="link" tamanho={16} /> Link e convites
          </Link>
          <AcoesCotacao id={cotacao.id} ativa={cotacao.ativa} compacto />
        </div>
      </div>

      {!temRespostas ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icone nome="relogio" tamanho={26} />
            </div>
            <h3>Nenhuma proposta ainda</h3>
            <p>Envie o link para os fornecedores. O comparativo aparece aqui assim que a primeira proposta chegar.</p>
            <Link href={`/cotacao/${cotacao.id}`} className="btn">
              <Icone nome="enviar" /> Enviar link
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid-4 mb-6">
            <div className="stat stat--brand">
              <div className="stat__label"><Icone nome="trofeu" tamanho={15} /> Melhor combinação</div>
              <div className="stat__value">{formatMoeda(analise.melhorCombinacao)}</div>
              <div className="stat__hint">comprando cada item de quem cobra menos</div>
            </div>
            <div className="stat stat--success">
              <div className="stat__label"><Icone nome="porco" tamanho={15} /> Economia</div>
              <div className="stat__value">{formatMoeda(analise.economia)}</div>
              <div className="stat__hint">
                {analise.piorUnico && analise.itensSemOferta === 0
                  ? `vs. tudo com ${analise.piorUnico.resposta.nomeFornecedor}`
                  : "precisa de um fornecedor com todos os itens"}
              </div>
            </div>
            <div className="stat">
              <div className="stat__label"><Icone nome="predio" tamanho={15} /> Melhor fornecedor único</div>
              <div className="stat__value" style={{ fontSize: "1.25rem" }}>
                {analise.melhorUnico ? formatMoeda(analise.melhorUnico.total) : "—"}
              </div>
              <div className="stat__hint truncate">
                {analise.melhorUnico ? analise.melhorUnico.resposta.nomeFornecedor : "nenhum cotou todos os itens"}
              </div>
            </div>
            <div className="stat">
              <div className="stat__label"><Icone nome="caixa" tamanho={15} /> Itens com preço</div>
              <div className="stat__value">
                {cotacao.itens.length - analise.itensSemOferta} <span className="text-muted" style={{ fontSize: "1rem" }}>de {cotacao.itens.length}</span>
              </div>
              <div className="stat__hint">{analise.itensSemOferta > 0 ? `${analise.itensSemOferta} sem nenhuma oferta` : "todos cotados"}</div>
            </div>
          </div>

          {/* Menor preço por item */}
          <div className="card card--flush mb-6">
            <div className="card__header card__header--bordered">
              <div>
                <div className="card__title"><Icone nome="trofeu" /> Menor preço por item</div>
                <div className="card__subtitle">O vencedor de cada item, já com o desconto aplicado.</div>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Qtd.</th>
                    <th>Fornecedor vencedor</th>
                    <th>Marca</th>
                    <th className="num">Preço unit.</th>
                    <th className="num">Total</th>
                    <th className="num">2º menor</th>
                  </tr>
                </thead>
                <tbody>
                  {analise.itens.map(({ item, melhor, ofertas }) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-600" style={{ color: "var(--text)" }}>{item.produto.nome}</div>
                        {item.marca && <div className="text-xs text-muted">Preferência: {item.marca}</div>}
                      </td>
                      <td className="num">{formatNumero(item.quantidade)} {item.produto.unidade}</td>
                      {melhor ? (
                        <>
                          <td>
                            <div className="fw-700 text-brand">{melhor.fornecedor}</div>
                            {melhor.estoqueInsuficiente && (
                              <span className="badge badge--warning mt-1">
                                Só tem {formatNumero(melhor.quantidadeDisponivel)} {item.produto.unidade}
                              </span>
                            )}
                          </td>
                          <td>{melhor.marca || <span className="muted">—</span>}</td>
                          <td className="num">
                            {melhor.desconto > 0 && <div className="price-strike">{formatMoeda(melhor.precoUnitario)}</div>}
                            <span className="price-best">{formatMoeda(melhor.precoFinal)}</span>
                          </td>
                          <td className="num fw-700">{formatMoeda(melhor.total)}</td>
                          <td className="num muted">
                            {ofertas[1] ? (
                              <>
                                {formatMoeda(ofertas[1].precoFinal)}
                                <div className="text-xs">+{formatMoeda((ofertas[1].precoFinal - melhor.precoFinal) * item.quantidade)}</div>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className="center muted" style={{ fontStyle: "italic" }}>
                          Nenhum fornecedor cotou este item
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="num">Total da melhor combinação</td>
                    <td className="num text-success" style={{ fontSize: "1.05rem" }}>{formatMoeda(analise.melhorCombinacao)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Pedido sugerido por fornecedor */}
          {analise.pedidosPorFornecedor.length > 0 && (
            <div className="mb-6">
              <div className="flex-between mb-3">
                <div>
                  <h2>Pedido sugerido por fornecedor</h2>
                  <p className="text-sm text-muted">O que comprar de cada um para pagar o menor preço em todos os itens.</p>
                </div>
              </div>
              <div className="grid-3">
                {analise.pedidosPorFornecedor.map((pedido) => {
                  const resposta = cotacao.respostas.find((r) => r.id === pedido.respostaId)!;
                  const textoPedido =
                    `Olá! Aqui é da ${empresa}. Sobre a cotação Nº ${numero} (${cotacao.titulo}), gostaríamos de fechar os itens:\n\n` +
                    pedido.itens
                      .map(
                        (l) =>
                          `• ${l.item.produto.nome} — ${formatNumero(l.item.quantidade)} ${l.item.produto.unidade} × ${formatMoeda(l.melhor!.precoFinal)} = ${formatMoeda(l.melhor!.total)}`,
                      )
                      .join("\n") +
                    `\n\nTotal: ${formatMoeda(pedido.total)}\nPodem confirmar?`;
                  const wa = linkWhatsapp(resposta.telefone, textoPedido);
                  const mail = resposta.email
                    ? `mailto:${resposta.email}?subject=${encodeURIComponent(`Pedido — Cotação Nº ${numero}`)}&body=${encodeURIComponent(textoPedido)}`
                    : null;
                  return (
                    <div key={pedido.respostaId} className="card">
                      <div className="flex-between mb-3">
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-700 truncate">{pedido.fornecedor}</div>
                          <div className="text-xs text-muted">{pedido.itens.length} item(ns)</div>
                        </div>
                        <div className="fw-700 tabular text-brand" style={{ fontSize: "1.1rem" }}>{formatMoeda(pedido.total)}</div>
                      </div>
                      <ul className="stack-sm text-sm mb-4" style={{ listStyle: "none" }}>
                        {pedido.itens.map((l) => (
                          <li key={l.item.id} className="flex-between" style={{ gap: "0.5rem" }}>
                            <span className="truncate">
                              {l.item.produto.nome} <span className="text-muted">· {formatNumero(l.item.quantidade)} {l.item.produto.unidade}</span>
                            </span>
                            <span className="tabular nowrap">{formatMoeda(l.melhor!.total)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="row no-print" style={{ gap: "0.4rem" }}>
                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn--whatsapp btn--sm">
                            <Icone nome="whatsapp" tamanho={15} /> Enviar pedido
                          </a>
                        )}
                        {mail && (
                          <a href={mail} className="btn btn--outline btn--sm">
                            <Icone nome="email" tamanho={15} /> E-mail
                          </a>
                        )}
                        {!wa && !mail && <span className="text-xs text-muted">Fornecedor não informou contato.</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matriz comparativa */}
          <div className="card card--flush mb-6">
            <div className="card__header card__header--bordered">
              <div>
                <div className="card__title"><Icone nome="grafico" /> Comparativo completo</div>
                <div className="card__subtitle">Preço final unitário de cada fornecedor. Em verde, o menor preço do item.</div>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="data-table matrix">
                <thead>
                  <tr>
                    <th className="sticky-col">Item</th>
                    {analise.fornecedores.map((f) => (
                      <th key={f.resposta.id} className="supplier-head">
                        <div className="fw-700">{f.resposta.nomeFornecedor}</div>
                        <div className="text-xs text-muted" style={{ fontWeight: 500 }}>
                          {f.resposta.entregaImediata ? "Entrega imediata" : `Prazo: ${f.resposta.prazoEntrega || "—"}`}
                          {" · "}
                          {f.resposta.condicaoPagamento || "pagamento a combinar"}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analise.itens.map(({ item, ofertas, melhor }) => (
                    <tr key={item.id}>
                      <td className="sticky-col">
                        <div className="fw-600" style={{ color: "var(--text)" }}>{item.produto.nome}</div>
                        <div className="text-xs text-muted">{formatNumero(item.quantidade)} {item.produto.unidade}</div>
                      </td>
                      {analise.fornecedores.map((f) => {
                        const o = ofertas.find((x) => x.respostaId === f.resposta.id);
                        if (!o) {
                          return (
                            <td key={f.resposta.id} className="center muted">—</td>
                          );
                        }
                        const best = melhor?.respostaId === o.respostaId;
                        return (
                          <td key={f.resposta.id} className={`center ${best ? "cell-best" : ""}`}>
                            {o.desconto > 0 && <div className="price-strike">{formatMoeda(o.precoUnitario)}</div>}
                            <div className={best ? "price-best" : "price-final"}>{formatMoeda(o.precoFinal)}</div>
                            <div className="text-xs text-muted">
                              {o.marca ? `${o.marca} · ` : ""}total {formatMoeda(o.total)}
                            </div>
                            {o.estoqueInsuficiente && (
                              <div className="text-xs text-warning fw-600">estoque: {formatNumero(o.quantidadeDisponivel)}</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="sticky-col">Total do fornecedor</td>
                    {analise.fornecedores.map((f) => (
                      <td key={f.resposta.id} className="center">
                        {f.descontoGeral > 0 && (
                          <div className="text-xs text-muted" style={{ fontWeight: 500 }}>
                            {formatMoeda(f.soma)} − desc. {formatMoeda(f.descontoGeral)}
                          </div>
                        )}
                        <div className={analise.melhorUnico?.resposta.id === f.resposta.id ? "price-best" : ""}>{formatMoeda(f.total)}</div>
                        <div className="text-xs text-muted" style={{ fontWeight: 500 }}>
                          {f.completo ? "cotou todos os itens" : `${f.cotados} de ${cotacao.itens.length} itens`}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Fornecedores */}
          <h2 className="mb-3">Fornecedores</h2>
          <div className="grid-3">
            {analise.fornecedores.map((f) => {
              const r = f.resposta;
              const wa = linkWhatsapp(r.telefone);
              return (
                <div key={r.id} className="card">
                  <div className="row-nowrap mb-3">
                    <span className="avatar">{r.nomeFornecedor.slice(0, 2).toUpperCase()}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-700 truncate">{r.nomeFornecedor}</div>
                      <div className="text-xs text-muted">Enviada em {formatDataHora(r.createdAt)}</div>
                    </div>
                  </div>
                  <dl className="stack-sm text-sm">
                    {r.cnpj && <div className="flex-between"><dt className="text-muted">CNPJ</dt><dd>{formatDocumento(r.cnpj)}</dd></div>}
                    <div className="flex-between"><dt className="text-muted">Entrega</dt><dd>{r.entregaImediata ? "Imediata" : r.prazoEntrega || "—"}</dd></div>
                    <div className="flex-between"><dt className="text-muted">Pagamento</dt><dd>{r.condicaoPagamento || "—"}</dd></div>
                    {f.descontoGeral > 0 && <div className="flex-between"><dt className="text-muted">Desconto geral</dt><dd className="text-success">{formatMoeda(f.descontoGeral)}</dd></div>}
                    <div className="flex-between"><dt className="text-muted">Total</dt><dd className="fw-700">{formatMoeda(f.total)}</dd></div>
                    {r.telefone && <div className="flex-between"><dt className="text-muted">Telefone</dt><dd>{formatTelefone(r.telefone)}</dd></div>}
                    {r.email && <div className="flex-between"><dt className="text-muted">E-mail</dt><dd className="truncate" style={{ maxWidth: "65%" }}>{r.email}</dd></div>}
                  </dl>
                  {r.observacoes && <p className="text-sm mt-3 card card--muted" style={{ padding: "0.6rem 0.8rem" }}>“{r.observacoes}”</p>}
                  {(wa || r.email) && (
                    <div className="row mt-4 no-print" style={{ gap: "0.4rem" }}>
                      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn--outline btn--sm"><Icone nome="whatsapp" tamanho={15} /> WhatsApp</a>}
                      {r.email && <a href={`mailto:${r.email}`} className="btn btn--outline btn--sm"><Icone nome="email" tamanho={15} /> E-mail</a>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
