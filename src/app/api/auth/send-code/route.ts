import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { resend } from '@/lib/resend';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, type } = await req.json();

    if (!email || !type) {
      return NextResponse.json({ error: 'E-mail e tipo são obrigatórios' }, { status: 400 });
    }

    // Gerar código numérico de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de validade

    if (type === 'REGISTER') {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Já existe um cadastro com este e-mail. Faça login.' }, { status: 400 });
      }
    }

    // Apaga códigos antigos desse e-mail/tipo
    await prisma.verificationCode.deleteMany({
      where: { email, type }
    });

    // Salva o novo código no banco
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        type,
        expiresAt,
      }
    });

    // Em ambiente de desenvolvimento, se não houver chave real, logamos no console para facilitar
    if (!process.env.RESEND_API_KEY) {
      console.log(`[DEV MODE] Código para ${email} (${type}): ${code}`);
      return NextResponse.json({ success: true, devMode: true });
    }

    // Envio real via Resend
    let subject = '';
    let html = '';

    if (type === 'REGISTER') {
      subject = 'Seu código de confirmação - Cadastro';
      html = `
        <h1>Confirme seu e-mail</h1>
        <p>Seu código de verificação é: <strong>${code}</strong></p>
        <p>Este código expira em 15 minutos.</p>
      `;
    } else if (type === 'RESET_PASSWORD') {
      subject = 'Código de Recuperação de Senha';
      html = `
        <h1>Recuperação de Senha</h1>
        <p>Seu código de recuperação é: <strong>${code}</strong></p>
        <p>Este código expira em 15 minutos.</p>
      `;
    }

    await resend.emails.send({
      from: 'onboarding@resend.dev', // Resend default for testing
      to: email,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar código:', error);
    return NextResponse.json({ error: 'Erro interno ao enviar e-mail' }, { status: 500 });
  }
}
