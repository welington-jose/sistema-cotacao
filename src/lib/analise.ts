import { prisma } from "./prisma";

// Cálculo do comparativo de uma cotação (usado na tela de análise e no PDF).
// Preço final unitário = preço unitário − desconto por unidade. Total do item = preço final × quantidade pedida.
// Total do fornecedor = soma dos itens cotados − desconto geral.

export async function carregarCotacaoDoUsuario(id: string, userId: string) {
  return prisma.cotacao.findFirst({
    where: { id, userId },
    include: {
      itens: { include: { produto: true }, orderBy: { produto: { nome: "asc" } } },
      respostas: { include: { itens: true }, orderBy: { createdAt: "asc" } },
      user: { select: { nomeEmpresa: true, name: true, logoBase64: true, documento: true, telefone: true, email: true } },
    },
  });
}

export type CotacaoCompleta = NonNullable<Awaited<ReturnType<typeof carregarCotacaoDoUsuario>>>;

export type Oferta = {
  respostaId: string;
  fornecedor: string;
  marca: string | null;
  precoUnitario: number;
  desconto: number;
  precoFinal: number;
  total: number;
  estoqueInsuficiente: boolean;
  quantidadeDisponivel: number | null;
};

export function analisarCotacao(cotacao: Pick<CotacaoCompleta, "itens" | "respostas">) {
  const itens = cotacao.itens.map((item) => {
    const ofertas: Oferta[] = [];
    for (const resposta of cotacao.respostas) {
      const r = resposta.itens.find((i) => i.cotacaoItemId === item.id);
      if (!r || !r.precoUnitario || r.precoUnitario <= 0) continue;
      const desconto = r.descontoItem || 0;
      const precoFinal = Math.max(0, r.precoUnitario - desconto);
      const estoqueInsuficiente =
        !r.atendeTotalPedido && typeof r.quantidadeDisponivel === "number" && r.quantidadeDisponivel < item.quantidade;
      ofertas.push({
        respostaId: resposta.id,
        fornecedor: resposta.nomeFornecedor,
        marca: r.marca,
        precoUnitario: r.precoUnitario,
        desconto,
        precoFinal,
        total: precoFinal * item.quantidade,
        estoqueInsuficiente,
        quantidadeDisponivel: r.atendeTotalPedido ? null : r.quantidadeDisponivel,
      });
    }
    ofertas.sort((a, b) => a.precoFinal - b.precoFinal);
    const melhor = ofertas[0] ?? null;
    const pior = ofertas[ofertas.length - 1] ?? null;
    return { item, ofertas, melhor, pior };
  });

  const fornecedores = cotacao.respostas.map((resposta) => {
    let soma = 0;
    let cotados = 0;
    let vitorias = 0;
    for (const linha of itens) {
      const oferta = linha.ofertas.find((o) => o.respostaId === resposta.id);
      if (oferta) {
        soma += oferta.total;
        cotados++;
        if (linha.melhor?.respostaId === resposta.id) vitorias++;
      }
    }
    const descontoGeral = resposta.descontoGlobal || 0;
    return {
      resposta,
      soma,
      descontoGeral,
      total: Math.max(0, soma - descontoGeral),
      cotados,
      vitorias,
      completo: cotados === cotacao.itens.length && cotacao.itens.length > 0,
    };
  });

  const melhorCombinacao = itens.reduce((acc, l) => acc + (l.melhor?.total ?? 0), 0);
  const itensSemOferta = itens.filter((l) => !l.melhor).length;
  const completos = fornecedores.filter((f) => f.completo).sort((a, b) => a.total - b.total);
  const melhorUnico = completos[0] ?? null;
  const piorUnico = completos[completos.length - 1] ?? null;

  // Economia: quanto a compra pelo menor preço de cada item economiza em relação a comprar tudo do
  // fornecedor completo mais caro (referência que o comprador teria sem cotar).
  const economia = piorUnico && itensSemOferta === 0 ? Math.max(0, piorUnico.total - melhorCombinacao) : 0;

  const vencedoresPorFornecedor = new Map<string, { fornecedor: string; itens: typeof itens; total: number }>();
  for (const linha of itens) {
    if (!linha.melhor) continue;
    const atual = vencedoresPorFornecedor.get(linha.melhor.respostaId) ?? {
      fornecedor: linha.melhor.fornecedor,
      itens: [],
      total: 0,
    };
    atual.itens.push(linha);
    atual.total += linha.melhor.total;
    vencedoresPorFornecedor.set(linha.melhor.respostaId, atual);
  }

  return {
    itens,
    fornecedores,
    melhorCombinacao,
    melhorUnico,
    piorUnico,
    economia,
    itensSemOferta,
    pedidosPorFornecedor: [...vencedoresPorFornecedor.entries()].map(([respostaId, v]) => ({ respostaId, ...v })),
  };
}

export type Analise = ReturnType<typeof analisarCotacao>;
