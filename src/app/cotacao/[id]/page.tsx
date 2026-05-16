import { PrismaClient } from "@prisma/client";
import CopyLinkButton from "./CopyLinkButton";

const prisma = new PrismaClient();

export default async function CotacaoAdminPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  const cotacao = await prisma.cotacao.findUnique({
    where: { id },
    include: {
      itens: {
        include: { produto: true }
      },
      respostas: true
    }
  });

  if (!cotacao) {
    return <div className="container">Cotação não encontrada.</div>;
  }

  return (
    <div className="container animate-fade-in">
      <div className="flex-between mb-8">
        <div>
          <h1>{cotacao.titulo}</h1>
          <p>Criada em {cotacao.createdAt.toLocaleDateString('pt-BR')}</p>
        </div>
        <div>
          {cotacao.ativa ? (
            <span className="badge" style={{ backgroundColor: "var(--color-success)", color: "white" }}>Ativa</span>
          ) : (
            <span className="badge">Finalizada</span>
          )}
        </div>
      </div>

      <div className="grid-cols-2">
        <div>
          <div className="glass-panel mb-6">
            <h2>Itens Solicitados</h2>
            <div className="table-wrapper mt-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Marca</th>
                    <th>Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {cotacao.itens.map(item => (
                    <tr key={item.id}>
                      <td>{item.produto.nome}</td>
                      <td>{item.marca || '-'}</td>
                      <td>{item.quantidade} <span className="badge">{item.produto.unidade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel">
            <h2>Status de Respostas</h2>
            <p className="mt-2 text-center" style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-brand-600)" }}>
              {cotacao.respostas.length}
            </p>
            <p className="text-center">Fornecedores responderam</p>
            
            {cotacao.respostas.length > 0 && (
              <a href={`/dashboard/${id}`} className="btn mt-4 w-full text-center">
                Ver Tabela de Parametrização
              </a>
            )}
          </div>
        </div>

        <div>
           {cotacao.ativa && (
             <CopyLinkButton cotacaoId={cotacao.id} />
           )}
           
           {!cotacao.ativa && (
             <div className="glass-panel">
                <h3>Esta cotação foi finalizada.</h3>
                <p>Nenhum fornecedor novo poderá enviar respostas.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
