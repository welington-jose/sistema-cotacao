import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { DIAS_TESTE, DIAS_TOLERANCIA } from "./marca";

export type SituacaoAcesso = {
  tipo: "TESTE" | "ASSINANTE" | "ATRASADO" | "BLOQUEADO";
  liberado: boolean;
  diasRestantes: number;
  ate: Date | null;
};

const DIA = 24 * 60 * 60 * 1000;

export function situacaoAcesso(user: { trialEndsAt: Date | null; pagoAte: Date | null }): SituacaoAcesso {
  const agora = Date.now();
  const pago = user.pagoAte?.getTime() ?? 0;
  const teste = user.trialEndsAt?.getTime() ?? 0;

  if (pago > agora) {
    return { tipo: "ASSINANTE", liberado: true, diasRestantes: Math.ceil((pago - agora) / DIA), ate: user.pagoAte };
  }
  if (pago && pago + DIAS_TOLERANCIA * DIA > agora) {
    return { tipo: "ATRASADO", liberado: true, diasRestantes: Math.ceil((pago + DIAS_TOLERANCIA * DIA - agora) / DIA), ate: user.pagoAte };
  }
  if (teste > agora) {
    return { tipo: "TESTE", liberado: true, diasRestantes: Math.ceil((teste - agora) / DIA), ate: user.trialEndsAt };
  }
  return { tipo: "BLOQUEADO", liberado: false, diasRestantes: 0, ate: user.pagoAte ?? user.trialEndsAt };
}

export function fimDoTeste() {
  return new Date(Date.now() + DIAS_TESTE * DIA);
}

const camposUsuario = {
  id: true,
  name: true,
  email: true,
  image: true,
  nomeEmpresa: true,
  documento: true,
  telefone: true,
  logoBase64: false,
  trialEndsAt: true,
  pagoAte: true,
  plano: true,
  assinaturaStatus: true,
  asaasSubscriptionId: true,
} as const;

/** Usuário logado (ou null). Contas antigas sem data de teste ganham o teste a partir de agora. */
export async function usuarioAtual() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  let user = await prisma.user.findUnique({ where: { id: session.user.id }, select: camposUsuario });
  if (!user) return null;

  if (!user.trialEndsAt) {
    user = await prisma.user.update({ where: { id: user.id }, data: { trialEndsAt: fimDoTeste() }, select: camposUsuario });
  }

  return { ...user, acesso: situacaoAcesso(user) };
}

export type UsuarioAtual = NonNullable<Awaited<ReturnType<typeof usuarioAtual>>>;

/** Para páginas internas: exige login. */
export async function exigirLogin() {
  const user = await usuarioAtual();
  if (!user) redirect("/login");
  return user;
}

/** Para páginas internas que exigem assinatura ou teste em dia. */
export async function exigirAcesso() {
  const user = await exigirLogin();
  if (!user.acesso.liberado) redirect("/assinatura");
  return user;
}
