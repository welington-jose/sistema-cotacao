import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "google_auth_intent";

export async function POST(req: Request) {
  const { intent } = await req.json();

  if (intent !== "login" && intent !== "register") {
    return NextResponse.json({ error: "Intenção inválida" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, intent, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return NextResponse.json({ success: true });
}
