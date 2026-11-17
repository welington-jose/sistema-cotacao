import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmail, emailCodigo } from "@/lib/email";

const TIPOS = ["REGISTER", "RESET_PASSWORD"] as const;

export async function POST(req: Request) {
  try {
    const corpo = await req.json().catch(() => ({}));
    const email = String(corpo.email || "").trim().toLowerCase();
    const type = corpo.type as (typeof TIPOS)[number];

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    if (!TIPOS.includes(type)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }

    const existente = await prisma.user.findUnique({ where: { email }, select: { id: true, password: true } });

    if (type === "REGISTER" && existente) {
      return NextResponse.json({ error: "Já existe uma conta com este e-mail. Faça login." }, { status: 400 });
    }

    // No "esqueci a senha", não revela se o e-mail existe: responde igual, mas só envia se houver conta.
    if (type === "RESET_PASSWORD" && !existente) {
      return NextResponse.json({ success: true });
    }

    // No máximo um código por minuto para o mesmo e-mail.
    const recente = await prisma.verificationCode.findFirst({
      where: { email, type, createdAt: { gt: new Date(Date.now() - 60 * 1000) } },
    });
    if (recente) {
      return NextResponse.json({ error: "Aguarde um minuto para pedir outro código." }, { status: 429 });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.verificationCode.deleteMany({ where: { email, type } });
    await prisma.verificationCode.create({
      data: { email, code, type, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    });

    const conteudo = emailCodigo(type, code);
    const r = await enviarEmail({ para: email, assunto: conteudo.assunto, html: conteudo.html });

    return NextResponse.json({ success: true, devMode: r.modoDesenvolvimento });
  } catch (error) {
    console.error("Erro ao enviar código:", error);
    return NextResponse.json({ error: "Não foi possível enviar o e-mail agora. Tente novamente." }, { status: 500 });
  }
}
