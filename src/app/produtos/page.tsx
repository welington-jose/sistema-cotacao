import Link from "next/link";
import { exigirAcesso } from "@/lib/acesso";
import { prisma } from "@/lib/prisma";
import Icone from "@/components/Icone";
import ProdutosClient from "./ProdutosClient";

export const metadata = { title: "Produtos" };

export default async function ProdutosPage() {
  const user = await exigirAcesso();

  const produtos = await prisma.produto.findMany({
    where: { userId: user.id },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, unidade: true, descricao: true, _count: { select: { itensCotacao: true } } },
  });

  return (
    <div className="container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Catálogo de produtos</h1>
          <p className="page-header__subtitle">
            Cadastre uma vez e use em todas as cotações. Só a sua empresa vê este catálogo.
          </p>
        </div>
        <Link href="/cotacoes/nova" className="btn">
          <Icone nome="mais" /> Nova cotação
        </Link>
      </div>

      <ProdutosClient
        produtos={produtos.map((p) => ({ id: p.id, nome: p.nome, unidade: p.unidade || "un", descricao: p.descricao, usos: p._count.itensCotacao }))}
      />
    </div>
  );
}
