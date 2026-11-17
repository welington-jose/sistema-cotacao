import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrarPagamento } from "@/lib/assinatura";
import { PLANOS, type PlanoId } from "@/lib/marca";

// Webhook do Asaas. Cadastrar no painel do Asaas:
//   URL: https://SEU-DOMINIO/api/asaas/webhook
//   Token de autenticação: o mesmo valor de ASAAS_WEBHOOK_TOKEN
//   Eventos: cobranças (PAYMENT_*) e assinaturas (SUBSCRIPTION_*)

type Evento = {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    billingType?: string;
    externalReference?: string;
  };
  subscription?: { id: string };
};

async function acharUsuario(p: NonNullable<Evento["payment"]>) {
  if (p.subscription) {
    const u = await prisma.user.findUnique({ where: { asaasSubscriptionId: p.subscription }, select: { id: true, plano: true } });
    if (u) return u;
  }
  if (p.externalReference) {
    const u = await prisma.user.findUnique({ where: { id: p.externalReference }, select: { id: true, plano: true } });
    if (u) return u;
  }
  return prisma.user.findUnique({ where: { asaasCustomerId: p.customer }, select: { id: true, plano: true } });
}

export async function POST(req: Request) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!token || req.headers.get("asaas-access-token") !== token) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const evento = (await req.json().catch(() => null)) as Evento | null;
  if (!evento?.event) return NextResponse.json({ ok: true });

  try {
    if (evento.payment && (evento.event === "PAYMENT_CONFIRMED" || evento.event === "PAYMENT_RECEIVED")) {
      const user = await acharUsuario(evento.payment);
      if (!user) {
        console.warn("Webhook Asaas: pagamento sem usuário correspondente", evento.payment.id);
        return NextResponse.json({ ok: true });
      }
      const plano: PlanoId =
        user.plano === "ANUAL" || user.plano === "MENSAL"
          ? user.plano
          : Math.abs(evento.payment.value - PLANOS.ANUAL.valor) < 1
            ? "ANUAL"
            : "MENSAL";
      await registrarPagamento({
        pagamentoId: evento.payment.id,
        userId: user.id,
        valor: evento.payment.value,
        plano,
        formaPagamento: evento.payment.billingType,
      });
    } else if (evento.payment && evento.event === "PAYMENT_OVERDUE") {
      const user = await acharUsuario(evento.payment);
      if (user) await prisma.user.update({ where: { id: user.id }, data: { assinaturaStatus: "ATRASADA" } });
    } else if (evento.payment && (evento.event === "PAYMENT_REFUNDED" || evento.event === "PAYMENT_CHARGEBACK_REQUESTED")) {
      await prisma.pagamento.updateMany({ where: { id: evento.payment.id }, data: { status: "ESTORNADO" } });
      console.warn("Webhook Asaas: pagamento estornado — revisar acesso manualmente", evento.payment.id);
    } else if (evento.subscription && (evento.event === "SUBSCRIPTION_DELETED" || evento.event === "SUBSCRIPTION_INACTIVATED")) {
      await prisma.user.updateMany({
        where: { asaasSubscriptionId: evento.subscription.id },
        data: { assinaturaStatus: "CANCELADA", isSubscribed: false },
      });
    }
  } catch (e) {
    console.error("Erro no webhook do Asaas:", e);
    // 500 faz o Asaas tentar de novo; o registro é idempotente.
    return NextResponse.json({ error: "erro interno" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
