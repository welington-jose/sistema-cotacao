"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirAcesso } from "@/lib/acesso";
import { formatCotacaoNumero, formatData, formatMoeda, parseValor, apenasDigitos } from "@/lib/format";
import { enviarEmail, emailConviteFornecedor, emailNovaProposta } from "@/lib/email";
import { urlBase } from "@/lib/marca";

type Resultado = { ok: true; mensagem?: string } | { ok: false; erro: string };

const LIMITE_TEXTO = 300;

function texto(valor: unknown, limite = LIMITE_TEXTO) {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

async function cotacaoDoUsuario(id: string) {
  const user = await exigirAcesso();
  const cotacao = await prisma.cotacao.findFirst({ where: { id, userId: user.id } });
  if (!cotacao) throw new Error("Cotação não encontrada.");
  return { user, cotacao };
}

function revalidarCotacao(id: string) {
  revalidatePath("/");
  revalidatePath(`/cotacao/${id}`);
  revalidatePath(`/dashboard/${id}`);
  revalidatePath(`/share/${id}`);
}

export async function createCotacao(data: {
  titulo: string;
  observacoes?: string;
  prazoResposta?: string;
  itens: { produtoId: string; quantidade: number; marca?: string }[];
}) {
  const user = await exigirAcesso();
  const titulo = texto(data.titulo, 120);

  if (!titulo) throw new Error("Informe um título para a cotação.");
  if (!Array.isArray(data.itens) || data.itens.length === 0) throw new Error("Adicione pelo menos um item.");
  if (data.itens.length > 500) throw new Error("Uma cotação pode ter no máximo 500 itens.");

  // Só aceita produtos do próprio usuário.
  const ids = [...new Set(data.itens.map((i) => i.produtoId))];
  const produtos = await prisma.produto.count({ where: { id: { in: ids }, userId: user.id } });
  if (produtos !== ids.length) throw new Error("Há produtos inválidos na lista. Recarregue a página.");

  const itens = data.itens.map((i) => ({
    produtoId: i.produtoId,
    quantidade: Number(i.quantidade),
    marca: texto(i.marca, 80) || null,
  }));
  if (itens.some((i) => !Number.isFinite(i.quantidade) || i.quantidade <= 0)) {
    throw new Error("Todas as quantidades precisam ser maiores que zero.");
  }

  let prazoResposta: Date | null = null;
  if (data.prazoResposta) {
    const d = new Date(`${data.prazoResposta}T23:59:59-04:00`);
    if (!Number.isNaN(d.getTime())) prazoResposta = d;
  }

  const cotacao = await prisma.cotacao.create({
    data: {
      titulo,
      observacoes: texto(data.observacoes, 1000) || null,
      prazoResposta,
      userId: user.id,
      itens: { create: itens },
    },
  });

  revalidatePath("/");
  redirect(`/cotacao/${cotacao.id}?nova=1`);
}

export async function finishCotacao(id: string) {
  await cotacaoDoUsuario(id);
  await prisma.cotacao.update({ where: { id }, data: { ativa: false } });
  revalidarCotacao(id);
}

export async function reabrirCotacao(id: string) {
  await cotacaoDoUsuario(id);
  await prisma.cotacao.update({ where: { id }, data: { ativa: true } });
  revalidarCotacao(id);
}

export async function excluirCotacao(id: string) {
  await cotacaoDoUsuario(id);
  await prisma.cotacao.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

export async function duplicarCotacao(id: string) {
  const { user } = await cotacaoDoUsuario(id);
  const original = await prisma.cotacao.findUniqueOrThrow({ where: { id }, include: { itens: true } });
  const nova = await prisma.cotacao.create({
    data: {
      titulo: `${original.titulo} (cópia)`.slice(0, 120),
      observacoes: original.observacoes,
      userId: user.id,
      itens: {
        create: original.itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade, marca: i.marca })),
      },
    },
  });
  revalidatePath("/");
  redirect(`/cotacao/${nova.id}?nova=1`);
}

export async function convidarFornecedores(id: string, emailsTexto: string, mensagem: string): Promise<Resultado> {
  try {
    const { user, cotacao } = await cotacaoDoUsuario(id);
    if (!cotacao.ativa) return { ok: false, erro: "A cotação está finalizada. Reabra para convidar fornecedores." };

    const emails = [
      ...new Set(
        emailsTexto
          .split(/[\s,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    const invalidos = emails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (emails.length === 0) return { ok: false, erro: "Informe pelo menos um e-mail." };
    if (invalidos.length) return { ok: false, erro: `E-mail inválido: ${invalidos.join(", ")}` };
    if (emails.length > 30) return { ok: false, erro: "Envie para no máximo 30 fornecedores por vez." };

    const itens = await prisma.cotacaoItem.count({ where: { cotacaoId: id } });
    const empresa = user.nomeEmpresa || user.name || "Uma empresa";
    const conteudo = emailConviteFornecedor({
      empresa,
      numero: formatCotacaoNumero(cotacao.numero),
      titulo: cotacao.titulo,
      itens,
      prazo: cotacao.prazoResposta ? formatData(cotacao.prazoResposta) : null,
      mensagem: texto(mensagem, 500) || null,
      link: `${urlBase()}/share/${cotacao.id}`,
    });

    let modoDev = false;
    for (const para of emails) {
      const r = await enviarEmail({
        para,
        assunto: conteudo.assunto,
        html: conteudo.html,
        responderPara: user.email ? { email: user.email, nome: empresa } : undefined,
      });
      modoDev = modoDev || r.modoDesenvolvimento;
    }

    return {
      ok: true,
      mensagem: modoDev
        ? `Modo de teste: ${emails.length} convite(s) gerado(s) no terminal (configure a Brevo para enviar de verdade).`
        : `Convite enviado para ${emails.length} fornecedor(es).`,
    };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Não foi possível enviar os convites." };
  }
}

// ---------------------------------------------------------------------------
// Resposta do fornecedor (página pública, sem login)
// ---------------------------------------------------------------------------
export async function submitFornecedorResposta(
  cotacaoId: string,
  data: {
    nomeFornecedor: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    observacoes?: string;
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
    }>;
  },
): Promise<Resultado> {
  const cotacao = await prisma.cotacao.findUnique({
    where: { id: cotacaoId },
    include: {
      itens: { select: { id: true, quantidade: true } },
      user: { select: { email: true, name: true, nomeEmpresa: true } },
      _count: { select: { respostas: true } },
    },
  });

  if (!cotacao) return { ok: false, erro: "Cotação não encontrada." };
  if (!cotacao.ativa) return { ok: false, erro: "Esta cotação já foi encerrada pelo comprador." };
  if (cotacao.prazoResposta && cotacao.prazoResposta.getTime() < Date.now()) {
    return { ok: false, erro: "O prazo para enviar propostas terminou." };
  }
  if (cotacao._count.respostas >= 100) return { ok: false, erro: "Esta cotação atingiu o limite de propostas." };

  const nomeFornecedor = texto(data.nomeFornecedor, 150);
  if (!nomeFornecedor) return { ok: false, erro: "Informe o nome da sua empresa." };

  const email = texto(data.email, 150).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, erro: "E-mail inválido." };

  const idsValidos = new Map(cotacao.itens.map((i) => [i.id, i.quantidade]));
  const itens = (Array.isArray(data.itens) ? data.itens : [])
    .filter((i) => idsValidos.has(i.cotacaoItemId))
    .map((i) => {
      const preco = parseValor(i.precoUnitario ?? null);
      const desconto = parseValor(i.descontoItem ?? null) ?? 0;
      const disponivel = parseValor(i.quantidadeDisponivel ?? null);
      const atende = i.atendeTotalPedido ?? true;
      return {
        cotacaoItemId: i.cotacaoItemId,
        marca: texto(i.marca, 80) || null,
        precoUnitario: preco && preco > 0 ? Math.min(preco, 1e9) : null,
        descontoItem: Math.max(0, Math.min(desconto, preco ?? 0)),
        atendeTotalPedido: atende,
        quantidadeDisponivel: atende ? idsValidos.get(i.cotacaoItemId)! : Math.max(0, disponivel ?? 0),
      };
    });

  const cotados = itens.filter((i) => i.precoUnitario);
  if (cotados.length === 0) return { ok: false, erro: "Informe o preço de pelo menos um item." };

  const descontoGlobal = Math.max(0, parseValor(data.descontoGlobal ?? null) ?? 0);

  await prisma.respostaFornecedor.create({
    data: {
      cotacaoId,
      nomeFornecedor,
      cnpj: apenasDigitos(data.cnpj).slice(0, 14) || null,
      email: email || null,
      telefone: apenasDigitos(data.telefone).slice(0, 13) || null,
      observacoes: texto(data.observacoes, 1000) || null,
      prazoEntrega: data.entregaImediata ? "Imediata" : texto(data.prazoEntrega, 60) || null,
      entregaImediata: Boolean(data.entregaImediata),
      condicaoPagamento: texto(data.condicaoPagamento, 120) || null,
      descontoGlobal,
      itens: { create: itens },
    },
  });

  // Avisa o comprador por e-mail (falha no e-mail não impede o envio da proposta).
  if (cotacao.user.email) {
    const soma = cotados.reduce(
      (acc, i) => acc + Math.max(0, (i.precoUnitario ?? 0) - i.descontoItem) * (idsValidos.get(i.cotacaoItemId) ?? 0),
      0,
    );
    const conteudo = emailNovaProposta({
      nomeComprador: cotacao.user.name || cotacao.user.nomeEmpresa || "",
      numero: formatCotacaoNumero(cotacao.numero),
      titulo: cotacao.titulo,
      fornecedor: nomeFornecedor,
      total: formatMoeda(Math.max(0, soma - descontoGlobal)),
      totalRespostas: cotacao._count.respostas + 1,
      cotacaoId,
    });
    enviarEmail({ para: cotacao.user.email, assunto: conteudo.assunto, html: conteudo.html }).catch((e) =>
      console.error("Aviso de nova proposta não enviado:", e),
    );
  }

  revalidarCotacao(cotacaoId);
  return { ok: true };
}
