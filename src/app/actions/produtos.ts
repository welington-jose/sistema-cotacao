"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirAcesso } from "@/lib/acesso";

type Resultado = { ok: true; mensagem?: string } | { ok: false; erro: string };

function limpar(valor: FormDataEntryValue | null, limite: number) {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

function revalidar() {
  revalidatePath("/produtos");
  revalidatePath("/cotacoes/nova");
}

export async function createProduto(data: FormData) {
  const user = await exigirAcesso();
  const nome = limpar(data.get("nome"), 150);
  const descricao = limpar(data.get("descricao"), 500);
  const unidade = limpar(data.get("unidade"), 10) || "un";
  const returnTo = data.get("returnTo");

  if (!nome) throw new Error("Informe o nome do produto.");

  await prisma.produto.create({
    data: { nome, descricao: descricao || null, unidade, userId: user.id },
  });

  revalidar();
  if (returnTo === "/cotacoes/nova") redirect("/cotacoes/nova");
}

/** Cadastro rápido (usado dentro da tela de nova cotação). Devolve o produto criado. */
export async function criarProdutoRapido(nome: string, unidade: string) {
  const user = await exigirAcesso();
  const n = nome.trim().slice(0, 150);
  if (!n) throw new Error("Informe o nome do produto.");
  const produto = await prisma.produto.create({
    data: { nome: n, unidade: unidade.trim().slice(0, 10) || "un", userId: user.id },
    select: { id: true, nome: true, unidade: true },
  });
  revalidar();
  return produto;
}

/** Vários produtos de uma vez: um por linha, opcionalmente "Nome ; unidade". */
export async function importarProdutos(textoLinhas: string): Promise<Resultado> {
  const user = await exigirAcesso();
  const existentes = new Set(
    (await prisma.produto.findMany({ where: { userId: user.id }, select: { nome: true } })).map((p) => p.nome.toLowerCase()),
  );

  const novos: { nome: string; unidade: string; userId: string }[] = [];
  for (const linha of textoLinhas.split(/\r?\n/)) {
    const [nomeBruto, unidadeBruta] = linha.split(/[;\t]/);
    const nome = (nomeBruto || "").trim().slice(0, 150);
    if (!nome || existentes.has(nome.toLowerCase())) continue;
    existentes.add(nome.toLowerCase());
    novos.push({ nome, unidade: (unidadeBruta || "un").trim().toLowerCase().slice(0, 10) || "un", userId: user.id });
  }

  if (novos.length === 0) return { ok: false, erro: "Nenhum produto novo encontrado (linhas vazias ou já cadastrados)." };
  if (novos.length > 1000) return { ok: false, erro: "Importe no máximo 1.000 produtos por vez." };

  await prisma.produto.createMany({ data: novos });
  revalidar();
  return { ok: true, mensagem: `${novos.length} produto(s) cadastrado(s).` };
}

export async function atualizarProduto(id: string, dados: { nome: string; unidade: string; descricao?: string }): Promise<Resultado> {
  const user = await exigirAcesso();
  const nome = dados.nome.trim().slice(0, 150);
  if (!nome) return { ok: false, erro: "Informe o nome do produto." };

  const r = await prisma.produto.updateMany({
    where: { id, userId: user.id },
    data: { nome, unidade: dados.unidade.trim().slice(0, 10) || "un", descricao: dados.descricao?.trim().slice(0, 500) || null },
  });
  if (r.count === 0) return { ok: false, erro: "Produto não encontrado." };
  revalidar();
  return { ok: true };
}

export async function deleteProduto(id: string): Promise<Resultado> {
  const user = await exigirAcesso();
  const usado = await prisma.cotacaoItem.count({ where: { produtoId: id, cotacao: { userId: user.id } } });
  if (usado > 0) {
    return { ok: false, erro: "Este produto já está em cotações e não pode ser excluído (o histórico seria perdido)." };
  }
  const r = await prisma.produto.deleteMany({ where: { id, userId: user.id } });
  if (r.count === 0) return { ok: false, erro: "Produto não encontrado." };
  revalidar();
  return { ok: true };
}
