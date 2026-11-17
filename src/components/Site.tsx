import Link from "next/link";
import { Marca } from "./Icone";
import { MARCA } from "@/lib/marca";

export function SiteHeader({ logado = false }: { logado?: boolean }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Marca />
        <nav className="site-nav" aria-label="Site">
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/#recursos">Recursos</Link>
          <Link href="/#precos">Preços</Link>
          <Link href="/#perguntas">Dúvidas</Link>
        </nav>
        <div className="row" style={{ marginLeft: "auto" }}>
          {logado ? (
            <Link href="/" className="btn">
              Abrir o sistema
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn--ghost">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn">
                Testar grátis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span>
          © {new Date().getFullYear()} {MARCA.nome} · um produto {MARCA.empresa}
        </span>
        <span className="row" style={{ gap: "1.25rem" }}>
          <Link href="/termos">Termos de uso</Link>
          <Link href="/privacidade">Privacidade</Link>
          <a href={`mailto:${MARCA.emailSuporte}`}>{MARCA.emailSuporte}</a>
        </span>
      </div>
    </footer>
  );
}
