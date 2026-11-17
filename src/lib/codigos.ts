import { prisma } from "./prisma";

const MAX_TENTATIVAS = 5;

/**
 * Confere o código de 6 dígitos enviado por e-mail. Cada erro conta uma tentativa; depois de 5 o código é
 * invalidado (impede adivinhar por tentativa e erro). Com `consumir`, apaga o código após o uso.
 */
export async function validarCodigo(emailBruto: string, codigo: string, tipo: string, consumir: boolean) {
  const email = emailBruto.trim().toLowerCase();
  const registro = await prisma.verificationCode.findFirst({
    where: { email, type: tipo },
    orderBy: { createdAt: "desc" },
  });

  if (!registro) return { ok: false as const, erro: "Código não encontrado. Peça um novo código." };
  if (registro.expiresAt < new Date()) return { ok: false as const, erro: "O código expirou. Peça um novo." };
  if (registro.tentativas >= MAX_TENTATIVAS) {
    return { ok: false as const, erro: "Muitas tentativas erradas. Peça um novo código." };
  }

  if (registro.code !== codigo.trim()) {
    await prisma.verificationCode.update({ where: { id: registro.id }, data: { tentativas: { increment: 1 } } });
    const restantes = MAX_TENTATIVAS - registro.tentativas - 1;
    return { ok: false as const, erro: restantes > 0 ? `Código incorreto. Restam ${restantes} tentativa(s).` : "Muitas tentativas erradas. Peça um novo código." };
  }

  if (consumir) await prisma.verificationCode.delete({ where: { id: registro.id } });
  return { ok: true as const };
}
