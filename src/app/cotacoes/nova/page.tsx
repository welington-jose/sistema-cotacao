import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { prisma } from "@/lib/prisma";
import Icone from "@/components/Icone";
import NewCotacaoClient from "./NewCotacaoClient";

export const metadata = { title: "Nova cotação" };

export default async function NovaCotacaoPage() {
  const user = await exigirAcesso();

  const produtos = await prisma.produto.findMany({
    where: { userId: user.id },
    orderBy: [{ itensCotacao: { _count: "desc" } }, { nome: "asc" }],
    select: { id: true, nome: true, unidade: true, descricao: true, _count: { select: { itensCotacao: true } } },
  });

  return (
    <div className="container container--wide animate-fade-in">
      <div className="breadcrumb">
        <Link href="/">Cotações</Link> <span>/</span> <span>Nova cotação</span>
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Nova cotação</h1>
          <p className="page-header__subtitle">
            Escolha os produtos e as quantidades. Depois é só enviar o link para os fornecedores.
          </p>
        </div>
        <Link href="/produtos" className="btn btn--outline">
          <Icone nome="caixa" tamanho={16} /> Catálogo de produtos
        </Link>
      </div>

      <NewCotacaoClient
        produtos={produtos.map((p) => ({ id: p.id, nome: p.nome, unidade: p.unidade || "un", descricao: p.descricao, usos: p._count.itensCotacao }))}
      />
    </div>
  );
}
