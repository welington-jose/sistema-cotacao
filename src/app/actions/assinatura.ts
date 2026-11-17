"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirLogin } from "@/lib/acesso";
import { PLANOS, MARCA, type PlanoId } from "@/lib/marca";
import { asaasConfigurado, cancelarAssinatura, criarAssinatura, criarCliente, linkPrimeiraCobranca } from "@/lib/asaas";
import { registrarPagamento } from "@/lib/assinatura";
import { apenasDigitos, documentoValido } from "@/lib/format";

type Resultado = { ok: true; mensagem?: string } | { ok: false; erro: string };

export async function assinar(planoId: PlanoId, documentoInformado?: string): Promise<Resultado> {
  const user = await exigirLogin();
  const plano = PLANOS[planoId];
  if (!plano) return { ok: false, erro: "Plano inválido." };

  // O Asaas exige CPF/CNPJ para emitir cobrança.
  let documento = user.documento;
  if (!documento) {
    const d = apenasDigitos(documentoInformado);
    if (!documentoValido(d)) return { ok: false, erro: "Informe um CPF ou CNPJ válido para emitir a cobrança." };
    const outro = await prisma.user.findFirst({ where: { documento: d, NOT: { id: user.id } }, select: { id: true } });
    if (outro) return { ok: false, erro: "Este CPF/CNPJ já está em outra conta." };
    await prisma.user.update({ where: { id: user.id }, data: { documento: d } });
    documento = d;
  }

  if (!asaasConfigurado()) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, erro: "Pagamento indisponível no momento. Fale com o suporte." };
    }
    return { ok: false, erro: "Asaas não configurado (ASAAS_API_KEY). Em teste, use “Simular pagamento”." };
  }

  let destino: string | null = null;
  try {
    const dados = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { asaasCustomerId: true, asaasSubscriptionId: true, plano: true, assinaturaStatus: true },
    });

    // Já tem assinatura do mesmo plano: só abre a cobrança pendente.
    if (dados.asaasSubscriptionId && dados.plano === planoId && dados.assinaturaStatus !== "CANCELADA") {
      destino = await linkPrimeiraCobranca(dados.asaasSubscriptionId);
    } else {
      // Trocando de plano: encerra a assinatura anterior no Asaas.
      if (dados.asaasSubscriptionId && dados.assinaturaStatus !== "CANCELADA") {
        await cancelarAssinatura(dados.asaasSubscriptionId).catch((e) => console.error("Falha ao cancelar assinatura anterior:", e));
      }

      const clienteId =
        dados.asaasCustomerId ||
        (await criarCliente({
          nome: user.nomeEmpresa || user.name || user.email || "Cliente",
          documento,
          email: user.email || "",
          telefone: user.telefone,
          userId: user.id,
        }));

      const assinaturaId = await criarAssinatura({
        clienteId,
        valor: plano.valor,
        ciclo: plano.ciclo,
        primeiroVencimento: new Date(),
        descricao: `${MARCA.nome} — plano ${plano.nome}`,
        userId: user.id,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { asaasCustomerId: clienteId, asaasSubscriptionId: assinaturaId, plano: planoId, assinaturaStatus: "PENDENTE" },
      });

      destino = await linkPrimeiraCobranca(assinaturaId);
    }
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Não foi possível criar a cobrança." };
  }

  if (!destino) return { ok: false, erro: "Cobrança criada, mas o link ainda não está disponível. Tente de novo em instantes." };
  redirect(destino);
}

export async function cancelar(): Promise<Resultado> {
  const user = await exigirLogin();
  const dados = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { asaasSubscriptionId: true } });
  if (!dados.asaasSubscriptionId) return { ok: false, erro: "Nenhuma assinatura ativa." };

  try {
    if (asaasConfigurado()) await cancelarAssinatura(dados.asaasSubscriptionId);
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Não foi possível cancelar agora." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { assinaturaStatus: "CANCELADA", isSubscribed: false } });
  revalidatePath("/", "layout");
  return { ok: true, mensagem: "Assinatura cancelada. Seu acesso continua até o fim do período pago." };
}

/** Só em desenvolvimento (sem Asaas): simula um pagamento confirmado para testar a liberação. */
export async function simularPagamento(planoId: PlanoId): Promise<Resultado> {
  if (process.env.NODE_ENV === "production" || asaasConfigurado()) return { ok: false, erro: "Indisponível." };
  const user = await exigirLogin();
  await prisma.user.update({ where: { id: user.id }, data: { asaasSubscriptionId: `teste_${user.id}`, plano: planoId } });
  await registrarPagamento({ pagamentoId: `teste_${Date.now()}`, userId: user.id, valor: PLANOS[planoId].valor, plano: planoId, formaPagamento: "TESTE" });
  revalidatePath("/", "layout");
  return { ok: true, mensagem: "Pagamento simulado com sucesso." };
}
