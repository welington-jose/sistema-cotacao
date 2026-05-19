"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function createCotacao(data: { titulo: string, itens: { produtoId: string, quantidade: number, marca?: string }[] }) {
  if (!data.titulo || data.itens.length === 0) {
    throw new Error("Título e itens são obrigatórios");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autorizado");
  }

  const cotacao = await prisma.cotacao.create({
    data: {
      titulo: data.titulo,
      userId: session.user.id,
      itens: {
        create: data.itens.map(item => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          marca: item.marca
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
export async function submitFornecedorResposta(cotacaoId: string, data: {
  nomeFornecedor: string;
  prazoEntrega?: string;
  entregaImediata?: boolean;
  condicaoPagamento?: string;
  descontoGlobal?: string | number;
  itens: Array<{
    cotacaoItemId: string;
    marca?: string;
    precoUnitario?: string | number;
    descontoItem?: string | number;
    atendeTotalPedido?: boolean;
    quantidadeDisponivel?: string | number;
  }>
}) {
  const { nomeFornecedor, prazoEntrega, entregaImediata, condicaoPagamento, descontoGlobal, itens } = data;

  await prisma.respostaFornecedor.create({
    data: {
      cotacaoId,
      nomeFornecedor,
      prazoEntrega,
      entregaImediata: Boolean(entregaImediata),
      condicaoPagamento,
      descontoGlobal: typeof descontoGlobal === 'string' ? parseFloat(descontoGlobal) : (descontoGlobal || 0),
      itens: {
        create: itens.map((item) => ({
          cotacaoItemId: item.cotacaoItemId,
          marca: item.marca,
          precoUnitario: typeof item.precoUnitario === 'string' ? parseFloat(item.precoUnitario) : (item.precoUnitario || 0),
          descontoItem: typeof item.descontoItem === 'string' ? parseFloat(item.descontoItem) : (item.descontoItem || 0),
          atendeTotalPedido: item.atendeTotalPedido ?? true,
          quantidadeDisponivel:
            typeof item.quantidadeDisponivel === 'string'
              ? parseFloat(item.quantidadeDisponivel)
              : item.quantidadeDisponivel
        }))
      }
    }
  });

  // Revalidate admin paths
  revalidatePath(`/dashboard/${cotacaoId}`);
}
