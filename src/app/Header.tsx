"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icone, { Marca, type NomeIcone } from "@/components/Icone";

export type UsuarioHeader = {
  nome: string;
  email: string;
  imagem: string | null;
  acesso: { tipo: "TESTE" | "ASSINANTE" | "ATRASADO" | "BLOQUEADO"; diasRestantes: number };
} | null;

const links: { href: string; rotulo: string; icone: NomeIcone }[] = [
  { href: "/", rotulo: "Cotações", icone: "painel" },
  { href: "/produtos", rotulo: "Produtos", icone: "caixa" },
  { href: "/configuracoes", rotulo: "Minha empresa", icone: "predio" },
];

const SEM_HEADER = ["/login", "/cadastro", "/recuperar-senha", "/share", "/termos", "/privacidade"];

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function PlanoPill({ usuario }: { usuario: NonNullable<UsuarioHeader> }) {
  const { tipo, diasRestantes } = usuario.acesso;
  if (tipo === "ASSINANTE") {
    return (
      <Link href="/assinatura" className="plan-pill plan-pill--assinante">
        <Icone nome="checkCirculo" tamanho={14} /> Assinante
      </Link>
    );
  }
  if (tipo === "TESTE") {
    return (
      <Link href="/assinatura" className="plan-pill plan-pill--teste">
        <Icone nome="relogio" tamanho={14} />
        Teste grátis: {diasRestantes} {diasRestantes === 1 ? "dia" : "dias"}
      </Link>
    );
  }
  return (
    <Link href="/assinatura" className="plan-pill plan-pill--atrasado">
      <Icone nome="alerta" tamanho={14} /> {tipo === "ATRASADO" ? "Pagamento pendente" : "Assinar"}
    </Link>
  );
}

export default function Header({ usuario }: { usuario: UsuarioHeader }) {
  const pathname = usePathname() || "/";
  const [menuAberto, setMenuAberto] = useState(false);
  const [mobileAberto, setMobileAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha os menus ao trocar de página.
  const [rotaAnterior, setRotaAnterior] = useState(pathname);
  if (rotaAnterior !== pathname) {
    setRotaAnterior(pathname);
    setMenuAberto(false);
    setMobileAberto(false);
  }

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  if (!usuario || SEM_HEADER.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  const ativo = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/cotac") || pathname.startsWith("/dashboard") : pathname.startsWith(href);

  return (
    <header className="app-header no-print">
      <div className="app-header__inner">
        <Marca />

        <nav className="nav" aria-label="Principal">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`nav__link ${ativo(l.href) ? "nav__link--active" : ""}`}>
              <Icone nome={l.icone} tamanho={16} />
              {l.rotulo}
            </Link>
          ))}
        </nav>

        <div className="header-right">
          <PlanoPill usuario={usuario} />

          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="user-menu__button"
              onClick={() => setMenuAberto((v) => !v)}
              aria-expanded={menuAberto}
              aria-haspopup="menu"
            >
              <span className="avatar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {usuario.imagem ? <img src={usuario.imagem} alt="" referrerPolicy="no-referrer" /> : iniciais(usuario.nome)}
              </span>
              <span className="user-menu__name">{usuario.nome}</span>
            </button>

            {menuAberto && (
              <div className="dropdown" role="menu">
                <div className="dropdown__header">
                  <strong>{usuario.nome}</strong>
                  <span>{usuario.email}</span>
                </div>
                <Link href="/configuracoes" className="dropdown__item" role="menuitem">
                  <Icone nome="predio" tamanho={16} /> Minha empresa
                </Link>
                <Link href="/assinatura" className="dropdown__item" role="menuitem">
                  <Icone nome="cartao" tamanho={16} /> Plano e pagamento
                </Link>
                <button
                  type="button"
                  className="dropdown__item dropdown__item--danger"
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <Icone nome="sair" tamanho={16} /> Sair
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMobileAberto((v) => !v)}
            aria-label={mobileAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileAberto}
          >
            <Icone nome={mobileAberto ? "fechar" : "menu"} tamanho={20} />
          </button>
        </div>
      </div>

      {mobileAberto && (
        <nav className="mobile-nav" aria-label="Menu">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`nav__link ${ativo(l.href) ? "nav__link--active" : ""}`}>
              <Icone nome={l.icone} tamanho={18} />
              {l.rotulo}
            </Link>
          ))}
          <Link href="/assinatura" className="nav__link">
            <Icone nome="cartao" tamanho={18} /> Plano e pagamento
          </Link>
          <button type="button" className="nav__link" style={{ background: "none", border: 0, font: "inherit", cursor: "pointer", textAlign: "left" }} onClick={() => signOut({ callbackUrl: "/login" })}>
            <Icone nome="sair" tamanho={18} /> Sair
          </button>
          <PlanoPill usuario={usuario} />
        </nav>
      )}
    </header>
  );
}
