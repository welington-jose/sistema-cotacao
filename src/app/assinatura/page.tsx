import { exigirLogin } from "@/lib/acesso";
import { prisma } from "@/lib/prisma";
import { asaasConfigurado } from "@/lib/asaas";
import { DIAS_TESTE, PLANOS } from "@/lib/marca";
import { formatData, formatMoeda } from "@/lib/format";
import Icone from "@/components/Icone";
import AssinaturaClient from "./AssinaturaClient";

export const metadata = { title: "Plano e pagamento" };

export default async function AssinaturaPage() {
  const user = await exigirLogin();
  const pagamentos = await prisma.pagamento.findMany({ where: { userId: user.id }, orderBy: { pagoEm: "desc" }, take: 24 });
  const { acesso } = user;

  const modoTeste = !asaasConfigurado() && process.env.NODE_ENV !== "production";
  const assinaturaAtiva = Boolean(user.asaasSubscriptionId) && user.assinaturaStatus !== "CANCELADA";

  return (
    <div className="container animate-fade-in" style={{ maxWidth: 980 }}>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Plano e pagamento</h1>
          <p className="page-header__subtitle">Cotações, fornecedores e produtos ilimitados em qualquer plano.</p>
        </div>
      </div>

      {acesso.tipo === "BLOQUEADO" && (
        <div className="alert alert--warning mb-6">
          <Icone nome="cadeado" />
          <div>
            <strong>{user.pagoAte ? "Sua assinatura venceu." : "Seu teste grátis terminou."}</strong>
            Escolha um plano para voltar a usar. Suas cotações, produtos e propostas continuam guardados.
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="stat__label">Situação atual</div>
            <div className="row mt-1">
              <strong style={{ fontSize: "1.2rem" }}>
                {acesso.tipo === "TESTE" && `Teste grátis — ${acesso.diasRestantes} ${acesso.diasRestantes === 1 ? "dia restante" : "dias restantes"}`}
                {acesso.tipo === "ASSINANTE" && `Plano ${user.plano === "ANUAL" ? "Anual" : "Mensal"} ativo`}
                {acesso.tipo === "ATRASADO" && "Pagamento pendente"}
                {acesso.tipo === "BLOQUEADO" && "Sem plano ativo"}
              </strong>
              {acesso.tipo === "ASSINANTE" && user.assinaturaStatus === "CANCELADA" && <span className="badge badge--warning">Renovação cancelada</span>}
            </div>
            <div className="text-sm text-muted mt-1">
              {acesso.tipo === "TESTE" && `Termina em ${formatData(acesso.ate)}. Se assinar agora, os dias que faltam continuam valendo.`}
              {acesso.tipo === "ASSINANTE" && `Acesso garantido até ${formatData(acesso.ate)}.`}
              {acesso.tipo === "ATRASADO" && `Venceu em ${formatData(acesso.ate)}. O acesso continua por mais ${acesso.diasRestantes} dia(s).`}
              {acesso.tipo === "BLOQUEADO" && acesso.ate && `Encerrado em ${formatData(acesso.ate)}.`}
            </div>
          </div>
          <span
            className={`badge ${acesso.tipo === "ASSINANTE" ? "badge--success" : acesso.tipo === "TESTE" ? "badge--warning" : "badge--danger"} badge--dot`}
            style={{ fontSize: "0.82rem", padding: "0.3rem 0.75rem" }}
          >
            {acesso.liberado ? "Acesso liberado" : "Acesso bloqueado"}
          </span>
        </div>
      </div>

      <AssinaturaClient
        planos={[
          { ...PLANOS.MENSAL, valorMes: PLANOS.MENSAL.valor },
          { ...PLANOS.ANUAL, valorMes: PLANOS.ANUAL.valor / 12 },
        ]}
        descontoAnual={Math.round((1 - PLANOS.ANUAL.valor / (PLANOS.MENSAL.valor * 12)) * 100)}
        planoAtual={assinaturaAtiva ? (user.plano as "MENSAL" | "ANUAL" | null) : null}
        precisaDocumento={!user.documento}
        modoTeste={modoTeste}
        podeCancelar={assinaturaAtiva}
        diasTeste={DIAS_TESTE}
      />

      {pagamentos.length > 0 && (
        <div className="card card--flush mt-6">
          <div className="card__header card__header--bordered">
            <div className="card__title">
              <Icone nome="documento" /> Histórico de pagamentos
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Plano</th>
                  <th>Forma</th>
                  <th>Válido até</th>
                  <th className="num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td>{formatData(p.pagoEm)}</td>
                    <td>{p.plano === "ANUAL" ? "Anual" : "Mensal"}</td>
                    <td className="muted">{({ PIX: "PIX", BOLETO: "Boleto", CREDIT_CARD: "Cartão", TESTE: "Teste" } as Record<string, string>)[p.formaPagamento || ""] || p.formaPagamento || "—"}</td>
                    <td>{formatData(p.validoAte)}</td>
                    <td className="num">
                      {formatMoeda(p.valor)} {p.status === "ESTORNADO" && <span className="badge badge--danger">estornado</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
