import { PrismaClient } from "@prisma/client";
import NewCotacaoClient from "./NewCotacaoClient";

const prisma = new PrismaClient();

export default async function NovaCotacaoPage() {
  const produtos = await prisma.produto.findMany({
    orderBy: { nome: "asc" }
  });

  return (
    <div className="container animate-fade-in">
      <div className="mb-8">
        <h1>Nova Solicitação de Cotação</h1>
        <p>Selecione os produtos e as quantidades que deseja comprar para gerar um link para os fornecedores.</p>
      </div>

      <NewCotacaoClient produtos={produtos} />
    </div>
  );
}
