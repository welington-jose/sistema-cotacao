import { SiteFooter, SiteHeader } from "./Site";
import { usuarioAtual } from "@/lib/acesso";

export default async function PaginaTexto({ titulo, atualizado, children }: { titulo: string; atualizado: string; children: React.ReactNode }) {
  const user = await usuarioAtual().catch(() => null);
  return (
    <>
      <SiteHeader logado={Boolean(user)} />
      <div className="container container--narrow">
        <div className="card texto-legal">
          <h1 className="mb-2">{titulo}</h1>
          <p className="text-sm text-muted mb-6">Última atualização: {atualizado}</p>
          {children}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
