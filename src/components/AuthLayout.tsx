import Icone, { Marca } from "./Icone";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <aside className="auth-side">
        <Marca />
        <div>
          <h2>Compare propostas de fornecedores em minutos, não em dias.</h2>
          <ul className="auth-side__list">
            <li>
              <Icone nome="checkCirculo" /> Envie um link por WhatsApp ou e-mail. O fornecedor responde sem criar conta.
            </li>
            <li>
              <Icone nome="checkCirculo" /> O menor preço de cada item aparece destacado, sem planilha.
            </li>
            <li>
              <Icone nome="checkCirculo" /> Baixe o comparativo em PDF com a sua logomarca.
            </li>
          </ul>
        </div>
        <p className="text-sm">Seus dados ficam separados e protegidos. Cada empresa vê só o que é seu.</p>
      </aside>
      <div className="auth-main">
        <div className="auth-card animate-fade-in">{children}</div>
      </div>
    </div>
  );
}

export function IconeGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}
