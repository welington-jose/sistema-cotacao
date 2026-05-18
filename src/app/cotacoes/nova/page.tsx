import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NewCotacaoClient from "./NewCotacaoClient";

const prisma = new PrismaClient();

export default async function NovaCotacaoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const produtos = await prisma.produto.findMany({
    where: { userId: session.user.id },
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
