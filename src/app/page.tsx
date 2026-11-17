import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/acesso";
import { prisma } from "@/lib/prisma";
import { analisarCotacao } from "@/lib/analise";
import { formatCotacaoNumero, formatData, formatMoeda, jaPassou } from "@/lib/format";
import Icone from "@/components/Icone";
import Landing from "@/components/Landing";
import CopyShareLinkButton from "./CopyShareLinkButton";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function Home({ searchParams }: Props) {
  const user = await usuarioAtual();
  if (!user) return <Landing />;
  if (!user.acesso.liberado) redirect("/assinatura");

  const { status } = await searchParams;
  const filtro = status === "abertas" ? { ativa: true } : status === "finalizadas" ? { ativa: false } : {};

  const [todas, totalProdutos] = await Promise.all([
    prisma.cotacao.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        itens: { include: { produto: true } },
        respostas: { include: { itens: true } },
      },
    }),
    prisma.produto.count({ where: { userId: user.id } }),
  ]);

  const analisadas = todas.map((c) => ({ cotacao: c, analise: analisarCotacao(c) }));
  const abertas = todas.filter((c) => c.ativa).length;
  const propostas = todas.reduce((acc, c) => acc + c.respostas.length, 0);
  const economia = analisadas.reduce((acc, a) => acc + a.analise.economia, 0);

  const lista = analisadas.filter(({ cotacao }) =>
    "ativa" in filtro ? cotacao.ativa === filtro.ativa : true,
  );

  const nome = (user.name || user.nomeEmpresa || "").split(" ")[0];

  return (
    <div className="container animate-fade-in">
      {user.acesso.tipo === "TESTE" && user.acesso.diasRestantes <= 3 && (
        <div className="alert alert--warning mb-6">
          <Icone nome="relogio" />
          <div>
            <strong>
              Seu teste grátis termina em {user.acesso.diasRestantes} {user.acesso.diasRestantes === 1 ? "dia" : "dias"}.
            </strong>
            Assine agora para não perder o acesso. Você não perde os dias restantes do teste.{" "}
            <Link href="/assinatura">Ver planos</Link>
          </div>
        </div>
      )}
      {user.acesso.tipo === "ATRASADO" && (
        <div className="alert alert--error mb-6">
          <Icone nome="alerta" />
          <div>
            <strong>Não identificamos o pagamento da sua assinatura.</strong>
            O acesso continua por mais {user.acesso.diasRestantes} dia(s). <Link href="/assinatura">Regularizar agora</Link>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-header__title">{nome ? `Olá, ${nome}` : "Suas cotações"}</h1>
          <p className="page-header__subtitle">Crie cotações, envie o link para os fornecedores e compare as propostas.</p>
        </div>
        <div className="page-header__actions">
          <Link href="/cotacoes/nova" className="btn btn--lg">
            <Icone nome="mais" /> Nova cotação
          </Link>
        </div>
      </div>

      <div className="grid-4 mb-8">
        <div className="stat stat--brand">
          <div className="stat__label">
            <Icone nome="porco" tamanho={15} /> Economia identificada
          </div>
          <div className="stat__value">{formatMoeda(economia)}</div>
          <div className="stat__hint">Menor preço por item × proposta mais cara</div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <Icone nome="documento" tamanho={15} /> Cotações abertas
          </div>
          <div className="stat__value">{abertas}</div>
          <div className="stat__hint">{todas.length} no total</div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <Icone nome="usuarios" tamanho={15} /> Propostas recebidas
          </div>
          <div className="stat__value">{propostas}</div>
          <div className="stat__hint">de fornecedores</div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <Icone nome="caixa" tamanho={15} /> Produtos no catálogo
          </div>
          <div className="stat__value">{totalProdutos}</div>
          <div className="stat__hint">
            <Link href="/produtos">Gerenciar catálogo</Link>
          </div>
        </div>
      </div>

      {todas.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icone nome="documento" tamanho={26} />
            </div>
            <h3>Vamos criar sua primeira cotação</h3>
            <p>São três passos: escolha os produtos, envie o link aos fornecedores e veja o comparativo pronto.</p>
            <div className="grid-3 mb-6" style={{ maxWidth: 760, margin: "0 auto 1.5rem", textAlign: "left" }}>
              {[
                ["1", "Monte a lista", "Cadastre os produtos e as quantidades que você quer comprar."],
                ["2", "Envie o link", "Mande por WhatsApp ou e-mail. O fornecedor não precisa de conta."],
                ["3", "Compare", "O sistema mostra o menor preço de cada item e o total por fornecedor."],
              ].map(([n, t, d]) => (
                <div key={n} className="card card--muted" style={{ padding: "1rem" }}>
                  <span className="step-number">{n}</span>
                  <h4 className="mt-2">{t}</h4>
                  <p className="text-sm mt-1">{d}</p>
                </div>
              ))}
            </div>
            <Link href="/cotacoes/nova" className="btn btn--lg">
              <Icone nome="mais" /> Criar primeira cotação
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-between mb-4" style={{ flexWrap: "wrap" }}>
            <h2>Cotações</h2>
            <div className="tabs" role="tablist">
              <Link href="/" className={!status ? "active" : ""}>
                Todas
              </Link>
              <Link href="/?status=abertas" className={status === "abertas" ? "active" : ""}>
                Abertas
              </Link>
              <Link href="/?status=finalizadas" className={status === "finalizadas" ? "active" : ""}>
                Finalizadas
              </Link>
            </div>
          </div>

          {lista.length === 0 ? (
            <div className="card text-center text-muted">Nenhuma cotação neste filtro.</div>
          ) : (
            <div className="grid-3">
              {lista.map(({ cotacao, analise }) => {
                const respostas = cotacao.respostas.length;
                const prazoVencido = jaPassou(cotacao.prazoResposta);
                return (
                  <div key={cotacao.id} className="card card--hover quote-card">
                    <div className="quote-card__top">
                      <div style={{ minWidth: 0 }}>
                        <div className="quote-card__number">Nº {formatCotacaoNumero(cotacao.numero)}</div>
                        <h3 className="quote-card__title">
                          <Link href={respostas > 0 ? `/dashboard/${cotacao.id}` : `/cotacao/${cotacao.id}`} style={{ color: "inherit" }}>
                            {cotacao.titulo}
                          </Link>
                        </h3>
                      </div>
                      {cotacao.ativa ? (
                        prazoVencido ? (
                          <span className="badge badge--warning badge--dot">Prazo encerrado</span>
                        ) : (
                          <span className="badge badge--success badge--dot">Aberta</span>
                        )
                      ) : (
                        <span className="badge badge--dot">Finalizada</span>
                      )}
                    </div>

                    <div className="quote-card__meta">
                      <span>
                        <Icone nome="calendario" tamanho={14} /> {formatData(cotacao.createdAt)}
                      </span>
                      <span>
                        <Icone nome="caixa" tamanho={14} /> {cotacao.itens.length} {cotacao.itens.length === 1 ? "item" : "itens"}
                      </span>
                      {cotacao.prazoResposta && (
                        <span>
                          <Icone nome="relogio" tamanho={14} /> até {formatData(cotacao.prazoResposta)}
                        </span>
                      )}
                    </div>

                    {respostas > 0 && analise.melhorCombinacao > 0 && (
                      <div className="card card--muted" style={{ padding: "0.7rem 0.9rem" }}>
                        <div className="text-xs text-muted">Melhor combinação</div>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <strong className="tabular">{formatMoeda(analise.melhorCombinacao)}</strong>
                          {analise.economia > 0 && (
                            <span className="badge badge--success">economia {formatMoeda(analise.economia)}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="quote-card__footer">
                      <div className="responses-count">
                        <strong>{respostas}</strong>
                        <span>{respostas === 1 ? "proposta" : "propostas"}</span>
                      </div>
                      <div className="row" style={{ gap: "0.4rem" }}>
                        {cotacao.ativa && <CopyShareLinkButton cotacaoId={cotacao.id} />}
                        <Link
                          href={respostas > 0 ? `/dashboard/${cotacao.id}` : `/cotacao/${cotacao.id}`}
                          className="btn btn--sm"
                        >
                          {respostas > 0 ? "Comparar" : "Abrir"}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
