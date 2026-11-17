import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validarCodigo } from "@/lib/codigos";
import { fimDoTeste } from "@/lib/acesso";
import { apenasDigitos, documentoValido } from "@/lib/format";

export async function POST(req: Request) {
  try {
    const corpo = await req.json().catch(() => ({}));
    const email = String(corpo.email || "").trim().toLowerCase();
    const password = String(corpo.password || "");
    const name = String(corpo.name || "").trim().slice(0, 120);
    const nomeEmpresa = String(corpo.nomeEmpresa || "").trim().slice(0, 150);
    const documento = apenasDigitos(corpo.documento);
    const telefone = apenasDigitos(corpo.telefone).slice(0, 13);

    if (password.length < 8) return NextResponse.json({ error: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    if (!name || !nomeEmpresa) return NextResponse.json({ error: "Preencha seu nome e o nome da empresa." }, { status: 400 });
    if (documento && !documentoValido(documento)) return NextResponse.json({ error: "CPF ou CNPJ inválido." }, { status: 400 });

    const codigo = await validarCodigo(email, String(corpo.code || ""), "REGISTER", true);
    if (!codigo.ok) return NextResponse.json({ error: codigo.erro }, { status: 400 });

    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json({ error: "Já existe uma conta com este e-mail. Faça login." }, { status: 400 });
    }
    if (documento && (await prisma.user.findFirst({ where: { documento } }))) {
      return NextResponse.json({ error: "Este CPF/CNPJ já está cadastrado em outra conta." }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        name,
        nomeEmpresa,
        documento: documento || null,
        telefone: telefone || null,
        emailVerified: new Date(),
        trialEndsAt: fimDoTeste(),
      },
    });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return NextResponse.json({ error: "Erro interno ao registrar." }, { status: 500 });
  }
}
