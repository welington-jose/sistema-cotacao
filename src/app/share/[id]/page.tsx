import { PrismaClient } from "@prisma/client";
import SupplierForm from "./SupplierForm";

const prisma = new PrismaClient();

export default async function ShareCotacaoPage({ 
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
      user: {
        select: { logoBase64: true, nomeEmpresa: true }
      }
    }
  });

  if (!cotacao) {
    return (
      <div className="container" style={{ textAlign: "center", marginTop: "10vh" }}>
        <h2>Cotação não encontrada.</h2>
      </div>
    );
  }

  if (!cotacao.ativa) {
    return (
      <div className="container" style={{ textAlign: "center", marginTop: "10vh" }}>
        <h2>Cotação Finalizada</h2>
        <p>O prazo para envios desta cotação já foi encerrado.</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      <div className="mb-8" style={{ textAlign: "center" }}>
        {cotacao.user?.logoBase64 && (
          <img 
            src={cotacao.user.logoBase64} 
            alt={cotacao.user.nomeEmpresa || "Logomarca da Empresa"} 
            style={{ maxHeight: "80px", marginBottom: "1rem", objectFit: "contain" }} 
          />
        )}
        <h1 style={{ marginTop: cotacao.user?.logoBase64 ? '0' : '1rem' }}>{cotacao.titulo}</h1>
        <p>Preencha os valores abaixo para submeter sua proposta de fornecimento.</p>
      </div>

      <SupplierForm cotacaoId={cotacao.id} itens={cotacao.itens} />
    </div>
  );
}
