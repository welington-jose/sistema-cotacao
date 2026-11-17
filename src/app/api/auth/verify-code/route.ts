import { NextResponse } from "next/server";
import { validarCodigo } from "@/lib/codigos";

export async function POST(req: Request) {
  try {
    const corpo = await req.json().catch(() => ({}));
    const r = await validarCodigo(String(corpo.email || ""), String(corpo.code || ""), String(corpo.type || ""), false);
    if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao verificar código:", error);
    return NextResponse.json({ error: "Erro interno na verificação." }, { status: 500 });
  }
}
