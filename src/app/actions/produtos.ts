"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function createProduto(data: FormData) {
  const nome = data.get("nome") as string;
  const descricao = data.get("descricao") as string | null;
  const unidade = data.get("unidade") as string;
  const returnTo = data.get("returnTo") as string | null;

  if (!nome || !unidade) {
    throw new Error("Nome e unidade são obrigatórios");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  await prisma.produto.create({
    data: {
      nome,
      descricao: descricao || null,
      unidade,
      userId: session.user.id,
    },
  });

  revalidatePath("/produtos");
  revalidatePath("/cotacoes/nova");

  if (returnTo === "/cotacoes/nova") {
    redirect(returnTo);
  }
}

export async function deleteProduto(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  const deleted = await prisma.produto.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (deleted.count === 0) {
    throw new Error("Produto não encontrado ou não pertence ao usuário");
  }

  revalidatePath("/produtos");
}
