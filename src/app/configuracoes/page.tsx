import { exigirLogin } from "@/lib/acesso";
import { prisma } from "@/lib/prisma";
import { formatDocumento, formatTelefone } from "@/lib/format";
import Link from "next/link";
import Icone from "@/components/Icone";
import ConfiguracoesClient from "./ConfiguracoesClient";

export const metadata = { title: "Minha empresa" };

export default async function ConfiguracoesPage({ searchParams }: { searchParams: Promise<{ bemvindo?: string }> }) {
  const user = await exigirLogin();
  const { bemvindo } = await searchParams;
  const dados = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { logoBase64: true } });

  return (
    <div className="container container--narrow animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Minha empresa</h1>
          <p className="page-header__subtitle">Estes dados aparecem para os fornecedores e no PDF do comparativo.</p>
        </div>
      </div>

      {bemvindo && (
        <div className="alert alert--success mb-6">
          <Icone nome="checkCirculo" />
          <div>
            <strong>Conta criada! Seu teste grátis já começou.</strong>
            Complete os dados da empresa e envie sua logomarca. Depois, <Link href="/cotacoes/nova">crie a primeira cotação</Link>.
          </div>
        </div>
      )}

      <ConfiguracoesClient
        inicial={{
          nome: user.name || "",
          email: user.email || "",
          nomeEmpresa: user.nomeEmpresa || "",
          documento: formatDocumento(user.documento),
          telefone: formatTelefone(user.telefone),
          logo: dados.logoBase64,
        }}
      />
    </div>
  );
}
