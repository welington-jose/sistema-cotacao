import { prisma } from "./prisma";
import { PLANOS, type PlanoId } from "./marca";
import { enviarEmail, emailPagamentoConfirmado } from "./email";
import { formatData, formatMoeda } from "./format";

function somarMeses(data: Date, meses: number) {
  const d = new Date(data);
  d.setMonth(d.getMonth() + meses);
  return d;
}

/**
 * Registra um pagamento confirmado e estende o acesso. Idempotente: o mesmo pagamento (id do Asaas)
 * nunca é contado duas vezes, mesmo que o webhook chegue repetido.
 * O período pago começa no maior entre: hoje, fim do teste e fim do período já pago
 * (quem assina durante o teste não perde os dias restantes).
 */
export async function registrarPagamento(dados: {
  pagamentoId: string;
  userId: string;
  valor: number;
  plano: PlanoId;
  formaPagamento?: string | null;
}) {
  const jaExiste = await prisma.pagamento.findUnique({ where: { id: dados.pagamentoId } });
  if (jaExiste) return { novo: false, validoAte: jaExiste.validoAte };

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: dados.userId },
    select: { trialEndsAt: true, pagoAte: true, email: true, name: true, nomeEmpresa: true },
  });

  const agora = new Date();
  const inicio = new Date(Math.max(agora.getTime(), user.trialEndsAt?.getTime() ?? 0, user.pagoAte?.getTime() ?? 0));
  const validoAte = somarMeses(inicio, PLANOS[dados.plano].meses);

  await prisma.$transaction([
    prisma.pagamento.create({
      data: {
        id: dados.pagamentoId,
        userId: dados.userId,
        valor: dados.valor,
        plano: dados.plano,
        status: "CONFIRMADO",
        formaPagamento: dados.formaPagamento ?? null,
        validoAte,
      },
    }),
    prisma.user.update({
      where: { id: dados.userId },
      data: { pagoAte: validoAte, plano: dados.plano, assinaturaStatus: "ATIVA", isSubscribed: true },
    }),
  ]);

  if (user.email) {
    const conteudo = emailPagamentoConfirmado({
      nome: user.name || user.nomeEmpresa || "",
      plano: PLANOS[dados.plano].nome,
      valor: formatMoeda(dados.valor),
      validoAte: formatData(validoAte),
    });
    enviarEmail({ para: user.email, assunto: conteudo.assunto, html: conteudo.html }).catch((e) =>
      console.error("Recibo de pagamento não enviado:", e),
    );
  }

  return { novo: true, validoAte };
}
