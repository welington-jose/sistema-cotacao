import { renderToBuffer } from "@react-pdf/renderer";
import { usuarioAtual } from "@/lib/acesso";
import { analisarCotacao, carregarCotacaoDoUsuario } from "@/lib/analise";
import { formatCotacaoNumero } from "@/lib/format";
import { ComparativoPdf } from "@/lib/pdf/ComparativoPdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await usuarioAtual();
  if (!user) return new Response("Faça login para baixar o PDF.", { status: 401 });
  if (!user.acesso.liberado) return new Response("Assinatura necessária.", { status: 402 });

  const { id } = await params;
  const cotacao = await carregarCotacaoDoUsuario(id, user.id);
  if (!cotacao) return new Response("Cotação não encontrada.", { status: 404 });

  const analise = analisarCotacao(cotacao);
  const pdf = await renderToBuffer(<ComparativoPdf cotacao={cotacao} analise={analise} />);

  const nome = `comparativo-cotacao-${formatCotacaoNumero(cotacao.numero)}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}
