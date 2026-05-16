import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, code, type } = await req.json();

    if (!email || !code || !type) {
      return NextResponse.json({ error: 'E-mail, código e tipo são obrigatórios' }, { status: 400 });
    }

    const verification = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type
      }
    });

    if (!verification) {
      return NextResponse.json({ error: 'Código inválido ou não encontrado' }, { status: 400 });
    }

    if (new Date() > verification.expiresAt) {
      return NextResponse.json({ error: 'O código expirou. Solicite um novo.' }, { status: 400 });
    }

    // Código válido! Pode prosseguir para cadastro ou troca de senha.
    // Dependendo do fluxo, podemos apagar o código ou deixá-lo ser apagado no passo final.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    return NextResponse.json({ error: 'Erro interno na verificação' }, { status: 500 });
  }
}
