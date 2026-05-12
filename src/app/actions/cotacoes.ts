"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function createCotacao(data: { titulo: string, itens: { produtoId: string, quantidade: number }[] }) {
  if (!data.titulo || data.itens.length === 0) {
    throw new Error("Título e itens são obrigatórios");
  }

  const cotacao = await prisma.cotacao.create({
    data: {
      titulo: data.titulo,
      itens: {
        create: data.itens.map(item => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade
        }))
      }
    }
  });

  revalidatePath("/");
  redirect(`/cotacao/${cotacao.id}`);
}

export async function finishCotacao(id: string) {
  await prisma.cotacao.update({
    where: { id },
    data: { ativa: false }
  });
  revalidatePath(`/cotacao/${id}`);
  revalidatePath(`/dashboard/${id}`);
  revalidatePath("/");
}

// Para o Fornecedor responder a cotação
export async function submitFornecedorResposta(cotacaoId: string, data: any) {
  const { nomeFornecedor, prazoEntrega, condicaoPagamento, descontoGlobal, itens } = data;

  await prisma.respostaFornecedor.create({
    data: {
      cotacaoId,
      nomeFornecedor,
      prazoEntrega,
      condicaoPagamento,
      descontoGlobal: parseFloat(descontoGlobal) || 0,
      itens: {
        create: itens.map((item: any) => ({
          cotacaoItemId: item.cotacaoItemId,
          marca: item.marca,
          precoUnitario: parseFloat(item.precoUnitario) || 0,
          descontoItem: parseFloat(item.descontoItem) || 0
        }))
      }
    }
  });

  // Revalidate admin paths
  revalidatePath(`/dashboard/${cotacaoId}`);
}
