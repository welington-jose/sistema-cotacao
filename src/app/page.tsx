import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function Home() {
  const cotacoes = await prisma.cotacao.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { respostas: true }
      }
    }
  });

  return (
    <div className="container animate-fade-in">
      <div className="flex-between mb-8">
        <div>
          <h1>Dashboard de Cotações</h1>
          <p>Gerencie todas as suas solicitações de compra e analise as propostas.</p>
        </div>
        <Link href="/cotacoes/nova" className="btn">
          + Nova Cotação
        </Link>
      </div>

      <div className="grid-cols-2">
        {cotacoes.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem" }}>
            <h2 style={{ color: "var(--text-secondary)" }}>Nenhuma cotação criada ainda.</h2>
            <Link href="/cotacoes/nova" className="btn mt-4">Criar Primeira Cotação</Link>
          </div>
        ) : (
          cotacoes.map(cotacao => (
            <div key={cotacao.id} className="glass-panel" style={{ position: "relative" }}>
              <div className="flex-between">
                <h3 style={{ fontSize: "1.25rem", marginRight: "1rem" }}>{cotacao.titulo}</h3>
                {cotacao.ativa ? (
                  <span className="badge" style={{ backgroundColor: "var(--color-success)", color: "white" }}>Ativa</span>
                ) : (
                  <span className="badge">Finalizada</span>
                )}
              </div>
              <p className="mt-2 text-sm">Criada em {cotacao.createdAt.toLocaleDateString("pt-BR")}</p>
              
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-brand-600)" }}>{cotacao._count.respostas}</span>
                  <span style={{ fontSize: "0.85rem", marginLeft: "0.5rem" }}>respostas recebidas</span>
                </div>
                
                <Link href={cotacao._count.respostas > 0 ? `/dashboard/${cotacao.id}` : `/cotacao/${cotacao.id}`} className="btn btn--outline">
                  {cotacao._count.respostas > 0 ? "Ver Análise" : "Gerenciar Link"}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
