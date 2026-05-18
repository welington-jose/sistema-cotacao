import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { createProduto, deleteProduto } from "../actions/produtos";

const prisma = new PrismaClient();

export default async function ProdutosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const produtos = await prisma.produto.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container animate-fade-in">
      <div className="flex-between mb-4">
        <h1>Catálogo de Produtos</h1>
      </div>

      <div className="grid-cols-2">
        {/* Formulário de Cadastro */}
        <div>
          <div className="glass-panel">
            <h2>Novo Produto</h2>
            <form action={createProduto} className="mt-4">
              <div className="input-group">
                <label htmlFor="nome" className="input-label">Nome do Produto *</label>
                <input type="text" id="nome" name="nome" required className="input-field" placeholder="Ex: Cimento CP-II" />
              </div>

              <div className="input-group">
                <label htmlFor="descricao" className="input-label">Descrição (Opcional)</label>
                <textarea id="descricao" name="descricao" rows={3} className="input-field" placeholder="Detalhes adicionais..."></textarea>
              </div>

              <div className="input-group">
                <label htmlFor="unidade" className="input-label">Unidade de Medida *</label>
                <select id="unidade" name="unidade" required className="input-field">
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="m2">Metro Quadrado (m²)</option>
                  <option value="m3">Metro Cúbico (m³)</option>
                  <option value="l">Litro (lt)</option>
                  <option value="pct">Pacote (pct)</option>
                </select>
              </div>

              <button type="submit" className="btn mt-4 w-full">
                Cadastrar Produto
              </button>
            </form>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div>
          <div className="glass-panel">
            <h2>Produtos Cadastrados</h2>
            <div className="table-wrapper mt-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Un.</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center">Nenhum produto cadastrado.</td>
                    </tr>
                  ) : (
                    produtos.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{p.nome}</div>
                          {p.descricao && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.descricao}</div>}
                        </td>
                        <td><span className="badge">{p.unidade}</span></td>
                        <td>
                          <form action={async () => {
                            "use server";
                            await deleteProduto(p.id);
                          }}>
                            <button type="submit" className="btn btn--danger btn--outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                              Excluir
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
