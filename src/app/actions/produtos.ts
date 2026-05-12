"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createProduto(data: FormData) {
  const nome = data.get("nome") as string;
  const descricao = data.get("descricao") as string | null;
  const unidade = data.get("unidade") as string;

  if (!nome || !unidade) {
    throw new Error("Nome e unidade são obrigatórios");
  }

  await prisma.produto.create({
    data: {
      nome,
      descricao: descricao || null,
      unidade,
    },
  });

  revalidatePath("/produtos");
}

export async function deleteProduto(id: string) {
  await prisma.produto.delete({
    where: { id },
  });

  revalidatePath("/produtos");
}
