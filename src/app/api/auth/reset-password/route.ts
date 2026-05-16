import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'E-mail, código e nova senha são obrigatórios' }, { status: 400 });
    }

    // 1. Validar código
    const verification = await prisma.verificationCode.findFirst({
      where: { email, code, type: 'RESET_PASSWORD' }
    });

    if (!verification || new Date() > verification.expiresAt) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 });
    }

    // 2. Encontrar o usuário
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 3. Atualizar a senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // 4. Apagar código
    await prisma.verificationCode.delete({
      where: { id: verification.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
