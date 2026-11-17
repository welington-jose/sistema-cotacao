"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirLogin } from "@/lib/acesso";
import { apenasDigitos, documentoValido } from "@/lib/format";

type Resultado = { ok: true; mensagem?: string } | { ok: false; erro: string };

export async function salvarEmpresa(dados: { nome: string; nomeEmpresa: string; documento: string; telefone: string }): Promise<Resultado> {
  const user = await exigirLogin();
  const documento = apenasDigitos(dados.documento);

  if (!dados.nomeEmpresa.trim()) return { ok: false, erro: "Informe o nome da empresa." };
  if (documento && !documentoValido(documento)) return { ok: false, erro: "CPF ou CNPJ inválido." };

  if (documento) {
    const outro = await prisma.user.findFirst({ where: { documento, NOT: { id: user.id } }, select: { id: true } });
    if (outro) return { ok: false, erro: "Este CPF/CNPJ já está em outra conta." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: dados.nome.trim().slice(0, 120) || null,
      nomeEmpresa: dados.nomeEmpresa.trim().slice(0, 150),
      documento: documento || null,
      telefone: apenasDigitos(dados.telefone).slice(0, 13) || null,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true, mensagem: "Dados salvos." };
}

export async function salvarLogo(logo: string | null): Promise<Resultado> {
  const user = await exigirLogin();

  if (logo !== null) {
    if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(logo)) return { ok: false, erro: "Formato de imagem inválido." };
    if (logo.length > 1_500_000) return { ok: false, erro: "Imagem muito grande. Use uma imagem menor." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { logoBase64: logo } });
  revalidatePath("/configuracoes");
  return { ok: true, mensagem: logo ? "Logomarca salva." : "Logomarca removida." };
}
