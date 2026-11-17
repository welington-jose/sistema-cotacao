import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAcesso } from "@/lib/acesso";
import { carregarCotacaoDoUsuario, analisarCotacao } from "@/lib/analise";
import { formatCotacaoNumero, formatData, formatDataHora, formatMoeda, formatNumero } from "@/lib/format";
import Icone from "@/components/Icone";
import AcoesCotacao from "@/components/AcoesCotacao";
import CompartilharCotacao from "./CopyLinkButton";

export const metadata = { title: "Cotação" };

export default async function CotacaoAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nova?: string }>;
}) {
  const { id } = await params;
  const { nova } = await searchParams;
  const user = await exigirAcesso();
  const cotacao = await carregarCotacaoDoUsuario(id, user.id);
  if (!cotacao) notFound();

  const analise = analisarCotacao(cotacao);
  const numero = formatCotacaoNumero(cotacao.numero);
  const empresa = user.nomeEmpresa || user.name || "nossa empresa";

  return (
    <div className="container animate-fade-in">
      <div className="breadcrumb">
        <Link href="/">Cotações</Link> <span>/</span> <span>Nº {numero}</span>
      </div>

      {nova && (
        <div className="alert alert--success mb-6">
          <Icone nome="checkCirculo" />
          <div>
            <strong>Cotação criada!</strong>
            Agora envie o link abaixo para os seus fornecedores pelo WhatsApp ou por e-mail.
          </div>
        </div>
      )}

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
            <span className="text-sm text-muted">Criada em {formatData(cotacao.createdAt)}</span>
            {cotacao.prazoResposta && <span className="text-sm text-muted">· Prazo até {formatData(cotacao.prazoResposta)}</span>}
          </div>
        </div>
        <AcoesCotacao id={cotacao.id} ativa={cotacao.ativa} />
      </div>

      <div className="grid-main-aside">
        <div className="stack">
          <div className="card card--flush">
            <div className="card__header card__header--bordered">
              <div className="card__title">
                <Icone nome="caixa" /> Itens solicitados
              </div>
              <span className="badge">{cotacao.itens.length}</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Marca preferida</th>
                    <th className="num">Quantidade</th>
                    <th className="num">Melhor preço</th>
                  </tr>
                </thead>
                <tbody>
                  {analise.itens.map(({ item, melhor }) => (
                    <tr key={item.id}>
                      <td className="fw-600" style={{ color: "var(--text)" }}>{item.produto.nome}</td>
                      <td className="muted">{item.marca || "—"}</td>
                      <td className="num">
                        {formatNumero(item.quantidade)} <span className="badge">{item.produto.unidade}</span>
                      </td>
                      <td className="num">{melhor ? <span className="price-best">{formatMoeda(melhor.precoFinal)}</span> : <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {cotacao.observacoes && (
              <div className="card__footer text-sm">
                <strong>Observações:</strong> {cotacao.observacoes}
              </div>
            )}
          </div>

          <div className="card card--flush">
            <div className="card__header card__header--bordered">
              <div className="card__title">
                <Icone nome="usuarios" /> Propostas recebidas
              </div>
              {cotacao.respostas.length > 0 && (
                <Link href={`/dashboard/${cotacao.id}`} className="btn btn--sm">
                  <Icone nome="grafico" tamanho={15} /> Ver comparativo
                </Link>
              )}
            </div>
            {cotacao.respostas.length === 0 ? (
              <div className="empty-state" style={{ padding: "2.5rem 1.5rem" }}>
                <div className="empty-state__icon">
                  <Icone nome="relogio" tamanho={24} />
                </div>
                <h3>Aguardando propostas</h3>
                <p>Assim que um fornecedor responder, ele aparece aqui e você recebe um aviso por e-mail.</p>
              </div>
            ) : (
              <div className="list">
                {analise.fornecedores.map((f) => (
                  <div key={f.resposta.id} className="list-item">
                    <span className="avatar">{f.resposta.nomeFornecedor.slice(0, 2).toUpperCase()}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fw-700 truncate" style={{ color: "var(--text)" }}>{f.resposta.nomeFornecedor}</div>
                      <div className="text-xs text-muted">
                        {f.cotados} de {cotacao.itens.length} itens · enviada em {formatDataHora(f.resposta.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="fw-700 tabular">{formatMoeda(f.total)}</div>
                      {f.vitorias > 0 && <span className="badge badge--success">{f.vitorias} menor preço</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack sticky-top">
          {cotacao.ativa ? (
            <CompartilharCotacao
              cotacaoId={cotacao.id}
              numero={numero}
              titulo={cotacao.titulo}
              empresa={empresa}
              prazo={cotacao.prazoResposta ? formatData(cotacao.prazoResposta) : null}
            />
          ) : (
            <div className="card card--muted">
              <div className="card__title mb-2">
                <Icone nome="cadeado" /> Cotação finalizada
              </div>
              <p className="text-sm">O link não aceita novas propostas. Use “Reabrir” se precisar receber mais.</p>
            </div>
          )}

          <div className="card">
            <div className="stat__label">Melhor combinação até agora</div>
            <div className="stat__value">{formatMoeda(analise.melhorCombinacao)}</div>
            {analise.economia > 0 && <div className="stat__hint text-success fw-600">Economia de {formatMoeda(analise.economia)}</div>}
            {analise.itensSemOferta > 0 && cotacao.respostas.length > 0 && (
              <div className="stat__hint text-warning">{analise.itensSemOferta} item(ns) ainda sem preço</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
