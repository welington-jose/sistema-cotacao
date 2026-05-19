import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, code, password, name, documento, telefone, nomeEmpresa } = await req.json();

    if (!email || !code || !password) {
      return NextResponse.json({ error: 'E-mail, código e senha são obrigatórios' }, { status: 400 });
    }

    // 1. Validar o código (tipo REGISTER) novamente por segurança
    const verification = await prisma.verificationCode.findFirst({
      where: { email, code, type: 'REGISTER' }
    });

    if (!verification || new Date() > verification.expiresAt) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 });
    }

    // 2. Checar se o e-mail já tem cadastro completo
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Já existe um usuário com este e-mail. Faça login.' }, { status: 400 });
    }

    if (documento) {
      const existingDocument = await prisma.user.findFirst({
        where: {
          documento,
        }
      });

      if (existingDocument) {
        return NextResponse.json({ error: 'Já existe um usuário com este documento' }, { status: 400 });
      }
    }

    // 3. Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Criar o usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        documento,
        telefone,
        nomeEmpresa,
        emailVerified: new Date(), // E-mail já verificado pelo código
      }
    });

    // 5. Apagar o código para não ser reutilizado
    await prisma.verificationCode.delete({
      where: { id: verification.id }
    });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json({ error: 'Erro interno ao registrar' }, { status: 500 });
  }
}
