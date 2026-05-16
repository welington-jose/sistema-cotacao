import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { logoBase64: true }
    });
    return NextResponse.json({ logoBase64: user?.logoBase64 || null });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { logoBase64 } = await req.json();

    if (logoBase64 && logoBase64.length > 5000000) { // Limite de ~5MB
      return NextResponse.json({ error: 'A imagem é muito grande. Tente uma imagem menor.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { logoBase64 }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar logo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
