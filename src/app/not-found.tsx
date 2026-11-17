import Link from "next/link";
import Icone from "@/components/Icone";

export default function NaoEncontrado() {
  return (
    <div className="container container--narrow">
      <div className="card">
        <div className="empty-state">
          <div className="empty-state__icon">
            <Icone nome="busca" tamanho={26} />
          </div>
          <h3>Página não encontrada</h3>
          <p>O endereço pode estar errado, ou a cotação foi excluída ou pertence a outra conta.</p>
          <Link href="/" className="btn">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
