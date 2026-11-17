import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatCotacaoNumero, formatData, jaPassou } from "@/lib/format";
import Icone, { Marca } from "@/components/Icone";
import SupplierForm from "./SupplierForm";

type Props = { params: Promise<{ id: string }> };

async function carregar(id: string) {
  return prisma.cotacao.findUnique({
    where: { id },
    include: {
      itens: { include: { produto: { select: { nome: true, unidade: true, descricao: true } } }, orderBy: { produto: { nome: "asc" } } },
      user: { select: { logoBase64: true, nomeEmpresa: true, name: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await prisma.cotacao.findUnique({ where: { id }, select: { numero: true, titulo: true, user: { select: { nomeEmpresa: true } } } });
  if (!c) return { title: "Cotação não encontrada" };
  const empresa = c.user.nomeEmpresa || "Pedido de cotação";
  return {
    title: `Cotação Nº ${formatCotacaoNumero(c.numero)} — ${empresa}`,
    description: `${empresa} solicita sua proposta para: ${c.titulo}. Responda pelo link, sem precisar de cadastro.`,
    robots: { index: false, follow: false },
  };
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="app-header app-header--center">
        <div className="app-header__inner">
          <Marca subtitulo="Portal do fornecedor" href="#" />
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="site-footer__inner" style={{ justifyContent: "center" }}>
          <span>Proposta enviada com segurança pelo Cotações Inteligentes.</span>
        </div>
      </footer>
    </>
  );
}

function Aviso({ icone, titulo, texto }: { icone: "cadeado" | "alerta" | "relogio"; titulo: string; texto: string }) {
  return (
    <Moldura>
      <div className="container container--narrow">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icone nome={icone} tamanho={26} />
            </div>
            <h3>{titulo}</h3>
            <p>{texto}</p>
          </div>
        </div>
      </div>
    </Moldura>
  );
}

export default async function ShareCotacaoPage({ params }: Props) {
  const { id } = await params;
  const cotacao = await carregar(id);

  if (!cotacao) {
    return <Aviso icone="alerta" titulo="Cotação não encontrada" texto="Confira se o link está completo ou peça um novo link ao comprador." />;
  }
  if (!cotacao.ativa) {
    return <Aviso icone="cadeado" titulo="Cotação encerrada" texto="O comprador já encerrou esta cotação e não está recebendo novas propostas." />;
  }
  if (cotacao.prazoResposta && jaPassou(cotacao.prazoResposta)) {
    return <Aviso icone="relogio" titulo="Prazo encerrado" texto={`O prazo para enviar propostas terminou em ${formatData(cotacao.prazoResposta)}.`} />;
  }

  const empresa = cotacao.user.nomeEmpresa || cotacao.user.name || "Comprador";
  const logo = cotacao.user.logoBase64;

  return (
    <Moldura>
      <div className="container animate-fade-in" style={{ maxWidth: 1080 }}>
        <div className="supplier-hero">
          <div className="supplier-hero__logo">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={empresa} />
            ) : (
              <Icone nome="predio" tamanho={34} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div className="page-header__eyebrow">
              {empresa} · Cotação Nº {formatCotacaoNumero(cotacao.numero)}
            </div>
            <h1 style={{ fontSize: "1.5rem" }}>{cotacao.titulo}</h1>
            <p className="mt-1">
              Informe seus preços para os itens abaixo. Deixe em branco o que você não trabalha. Não é preciso criar conta.
            </p>
            <div className="row mt-3" style={{ justifyContent: "inherit" }}>
              <span className="badge badge--brand">
                <Icone nome="caixa" tamanho={13} /> {cotacao.itens.length} {cotacao.itens.length === 1 ? "item" : "itens"}
              </span>
              {cotacao.prazoResposta && (
                <span className="badge badge--warning">
                  <Icone nome="relogio" tamanho={13} /> Responder até {formatData(cotacao.prazoResposta)}
                </span>
              )}
            </div>
          </div>
        </div>

        {cotacao.observacoes && (
          <div className="alert alert--info mb-6">
            <Icone nome="info" />
            <div>
              <strong>Observações do comprador</strong>
              {cotacao.observacoes}
            </div>
          </div>
        )}

        <SupplierForm
          cotacaoId={cotacao.id}
          empresaCompradora={empresa}
          itens={cotacao.itens.map((i) => ({
            id: i.id,
            quantidade: i.quantidade,
            marca: i.marca,
            nome: i.produto.nome,
            unidade: i.produto.unidade || "un",
            descricao: i.produto.descricao,
          }))}
        />
      </div>
    </Moldura>
  );
}
