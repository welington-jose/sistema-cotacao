import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Inter } from "next/font/google";
import "./globals.css";
import Header, { type UsuarioHeader } from "./Header";
import Providers from "./providers";
import { usuarioAtual } from "@/lib/acesso";
import { MARCA, urlBase } from "@/lib/marca";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(urlBase()),
  title: {
    default: `${MARCA.nome} — cotação de compras com fornecedores`,
    template: `%s · ${MARCA.nome}`,
  },
  description:
    "Envie um link para seus fornecedores, receba as propostas e veja na hora o menor preço de cada item. Sistema de cotação de compras simples, sem planilha.",
  applicationName: MARCA.nome,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: MARCA.nome,
    title: `${MARCA.nome} — compare propostas de fornecedores em minutos`,
    description: "Envie um link, receba as propostas e veja o menor preço de cada item automaticamente.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection(); // páginas dependem do login: sempre renderizadas na hora
  let usuario: UsuarioHeader = null;
  try {
    const u = await usuarioAtual();
    if (u) {
      usuario = {
        nome: u.nomeEmpresa || u.name || u.email || "Minha conta",
        email: u.email || "",
        imagem: u.image,
        acesso: { tipo: u.acesso.tipo, diasRestantes: u.acesso.diasRestantes },
      };
    }
  } catch (erro) {
    console.error("Não foi possível carregar o usuário:", erro);
  }

  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <Providers>
          <Header usuario={usuario} />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
