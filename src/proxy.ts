import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protege a raiz e as rotas de cotação, dashboard, produtos e configurações
  matcher: [
    "/",
    "/dashboard/:path*",
    "/cotacoes/:path*",
    "/cotacao/:path*",
    "/produtos/:path*",
    "/configuracoes/:path*"
  ]
};
