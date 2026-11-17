import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validarCodigo } from "@/lib/codigos";

export async function POST(req: Request) {
  try {
    const corpo = await req.json().catch(() => ({}));
    const email = String(corpo.email || "").trim().toLowerCase();
    const newPassword = String(corpo.newPassword || "");

    if (newPassword.length < 8) return NextResponse.json({ error: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });

    const codigo = await validarCodigo(email, String(corpo.code || ""), "RESET_PASSWORD", true);
    if (!codigo.ok) return NextResponse.json({ error: codigo.erro }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });

    await prisma.user.update({ where: { email }, data: { password: await bcrypt.hash(newPassword, 10) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao trocar senha:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
