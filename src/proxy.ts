import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protege a raiz e as rotas de cotação e dashboard
  matcher: [
    "/",
    "/dashboard/:path*",
    "/cotacoes/:path*"
  ]
};
