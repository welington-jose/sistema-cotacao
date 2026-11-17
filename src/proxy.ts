import { withAuth } from "next-auth/middleware";

// Páginas internas exigem login. A página inicial (/) é pública: mostra o site para quem não está
// logado e o painel para quem está. O portal do fornecedor (/share) é sempre público.
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cotacoes/:path*",
    "/cotacao/:path*",
    "/produtos/:path*",
    "/configuracoes/:path*",
    "/assinatura/:path*",
  ],
};
