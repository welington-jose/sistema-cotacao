import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Analise, CotacaoCompleta } from "../analise";
import { formatCotacaoNumero, formatData, formatDataHora, formatDocumento, formatMoeda, formatNumero, formatTelefone } from "../format";
import { MARCA } from "../marca";

// PDF do comparativo (A4 paisagem). Fonte Helvetica embutida: suporta acentos do português.

const cor = {
  marca: "#0f766e",
  marcaClara: "#f0fdfa",
  texto: "#0f172a",
  suave: "#475569",
  mudo: "#64748b",
  borda: "#e2e8f0",
  fundo: "#f8fafc",
  verde: "#15803d",
  verdeClaro: "#dcfce7",
  laranja: "#b45309",
};

const s = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 40, paddingHorizontal: 30, fontFamily: "Helvetica", fontSize: 8.5, color: cor.texto },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: cor.marca, marginBottom: 14 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 64, height: 40, objectFit: "contain" },
  empresa: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  empresaInfo: { fontSize: 7.5, color: cor.mudo, marginTop: 2 },
  docTitulo: { fontSize: 15, fontFamily: "Helvetica-Bold", color: cor.marca, textAlign: "right" },
  docSub: { fontSize: 8, color: cor.suave, textAlign: "right", marginTop: 2 },
  titulo: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  sub: { fontSize: 8, color: cor.mudo, marginBottom: 12 },
  kpis: { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpi: { flex: 1, borderWidth: 1, borderColor: cor.borda, borderRadius: 6, padding: 8 },
  kpiDestaque: { backgroundColor: cor.marca, borderColor: cor.marca },
  kpiLabel: { fontSize: 7, color: cor.mudo, textTransform: "uppercase", letterSpacing: 0.5 },
  kpiValor: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 3 },
  kpiHint: { fontSize: 7, color: cor.mudo, marginTop: 2 },
  secao: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 4, color: cor.texto },
  tabela: { borderWidth: 1, borderColor: cor.borda, borderRadius: 4, marginBottom: 14 },
  linha: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: cor.borda },
  linhaUltima: { flexDirection: "row" },
  th: { backgroundColor: cor.fundo, paddingVertical: 5, paddingHorizontal: 6, fontSize: 7, fontFamily: "Helvetica-Bold", color: cor.mudo, textTransform: "uppercase" },
  td: { paddingVertical: 5, paddingHorizontal: 6, fontSize: 8.5 },
  tdTotal: { paddingVertical: 6, paddingHorizontal: 6, fontSize: 9, fontFamily: "Helvetica-Bold", backgroundColor: cor.fundo },
  num: { textAlign: "right" },
  centro: { textAlign: "center" },
  negrito: { fontFamily: "Helvetica-Bold" },
  verde: { color: cor.verde, fontFamily: "Helvetica-Bold" },
  riscado: { textDecoration: "line-through", color: cor.mudo, fontSize: 7 },
  pequeno: { fontSize: 7, color: cor.mudo },
  melhorCelula: { backgroundColor: cor.verdeClaro },
  pedidos: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  pedido: { width: "32.2%", borderWidth: 1, borderColor: cor.borda, borderRadius: 6, padding: 8 },
  pedidoTopo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  rodape: { position: "absolute", bottom: 16, left: 30, right: 30, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: cor.mudo, borderTopWidth: 1, borderTopColor: cor.borda, paddingTop: 6 },
});

function logoSuportado(logo: string | null | undefined) {
  return Boolean(logo && /^data:image\/(png|jpe?g);base64,/i.test(logo));
}

function Celula({ largura, estilo, children }: { largura: string | number; estilo?: object | object[]; children: React.ReactNode }) {
  const extra = Array.isArray(estilo) ? estilo : estilo ? [estilo] : [];
  return <Text style={[s.td, { width: largura }, ...extra]}>{children}</Text>;
}

function Cabecalho({ largura, children, alinhamento }: { largura: string | number; children: React.ReactNode; alinhamento?: "right" | "center" }) {
  return <Text style={[s.th, { width: largura }, alinhamento ? { textAlign: alinhamento } : {}]}>{children}</Text>;
}

export function ComparativoPdf({ cotacao, analise }: { cotacao: CotacaoCompleta; analise: Analise }) {
  const numero = formatCotacaoNumero(cotacao.numero);
  const empresa = cotacao.user.nomeEmpresa || cotacao.user.name || "";
  const infoEmpresa = [
    cotacao.user.documento ? formatDocumento(cotacao.user.documento) : null,
    cotacao.user.telefone ? formatTelefone(cotacao.user.telefone) : null,
    cotacao.user.email,
  ]
    .filter(Boolean)
    .join("  ·  ");

  // Até 5 fornecedores por tabela comparativa; mais que isso, quebra em blocos.
  const blocos: (typeof analise.fornecedores)[] = [];
  for (let i = 0; i < analise.fornecedores.length; i += 5) blocos.push(analise.fornecedores.slice(i, i + 5));

  return (
    <Document title={`Comparativo - Cotação ${numero}`} author={empresa} creator={MARCA.nome} producer={MARCA.nome}>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
            {logoSuportado(cotacao.user.logoBase64) && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={cotacao.user.logoBase64!} style={s.logo} />
            )}
            <View>
              <Text style={s.empresa}>{empresa}</Text>
              {infoEmpresa ? <Text style={s.empresaInfo}>{infoEmpresa}</Text> : null}
            </View>
          </View>
          <View>
            <Text style={s.docTitulo}>Comparativo de Cotação</Text>
            <Text style={s.docSub}>Nº {numero}  ·  emitido em {formatDataHora(new Date())}</Text>
          </View>
        </View>

        <Text style={s.titulo}>{cotacao.titulo}</Text>
        <Text style={s.sub}>
          Criada em {formatData(cotacao.createdAt)}  ·  {cotacao.itens.length} item(ns)  ·  {cotacao.respostas.length} proposta(s)
          {cotacao.ativa ? "  ·  em andamento" : "  ·  finalizada"}
        </Text>

        <View style={s.kpis}>
          <View style={[s.kpi, s.kpiDestaque]}>
            <Text style={[s.kpiLabel, { color: "#ccfbf1" }]}>Melhor combinação</Text>
            <Text style={[s.kpiValor, { color: "#ffffff" }]}>{formatMoeda(analise.melhorCombinacao)}</Text>
            <Text style={[s.kpiHint, { color: "#ccfbf1" }]}>menor preço de cada item</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Economia</Text>
            <Text style={[s.kpiValor, { color: cor.verde }]}>{formatMoeda(analise.economia)}</Text>
            <Text style={s.kpiHint}>
              {analise.piorUnico && analise.itensSemOferta === 0 ? `vs. tudo com ${analise.piorUnico.resposta.nomeFornecedor}` : "sem referência completa"}
            </Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Melhor fornecedor único</Text>
            <Text style={s.kpiValor}>{analise.melhorUnico ? formatMoeda(analise.melhorUnico.total) : "-"}</Text>
            <Text style={s.kpiHint}>{analise.melhorUnico ? analise.melhorUnico.resposta.nomeFornecedor : "nenhum cotou todos os itens"}</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Itens com preço</Text>
            <Text style={s.kpiValor}>
              {cotacao.itens.length - analise.itensSemOferta} de {cotacao.itens.length}
            </Text>
            <Text style={s.kpiHint}>{analise.itensSemOferta ? `${analise.itensSemOferta} sem oferta` : "todos cotados"}</Text>
          </View>
        </View>

        <Text style={s.secao}>Menor preço por item</Text>
        <View style={s.tabela}>
          <View style={s.linha} fixed>
            <Cabecalho largura="27%">Item</Cabecalho>
            <Cabecalho largura="10%" alinhamento="right">Qtd.</Cabecalho>
            <Cabecalho largura="23%">Fornecedor vencedor</Cabecalho>
            <Cabecalho largura="12%">Marca</Cabecalho>
            <Cabecalho largura="14%" alinhamento="right">Preço unit.</Cabecalho>
            <Cabecalho largura="14%" alinhamento="right">Total</Cabecalho>
          </View>
          {analise.itens.map(({ item, melhor }) => (
            <View key={item.id} style={s.linha} wrap={false}>
              <View style={[s.td, { width: "27%" }]}>
                <Text style={s.negrito}>{item.produto.nome}</Text>
                {item.marca ? <Text style={s.pequeno}>Preferência: {item.marca}</Text> : null}
              </View>
              <Celula largura="10%" estilo={s.num}>
                {formatNumero(item.quantidade)} {item.produto.unidade}
              </Celula>
              {melhor ? (
                <>
                  <View style={[s.td, { width: "23%" }]}>
                    <Text style={[s.negrito, { color: cor.marca }]}>{melhor.fornecedor}</Text>
                    {melhor.estoqueInsuficiente ? (
                      <Text style={[s.pequeno, { color: cor.laranja }]}>
                        estoque: {formatNumero(melhor.quantidadeDisponivel)} {item.produto.unidade}
                      </Text>
                    ) : null}
                  </View>
                  <Celula largura="12%">{melhor.marca || "-"}</Celula>
                  <View style={[s.td, { width: "14%" }]}>
                    {melhor.desconto > 0 ? <Text style={[s.riscado, s.num]}>{formatMoeda(melhor.precoUnitario)}</Text> : null}
                    <Text style={[s.verde, s.num]}>{formatMoeda(melhor.precoFinal)}</Text>
                  </View>
                  <Celula largura="14%" estilo={[s.num, s.negrito]}>
                    {formatMoeda(melhor.total)}
                  </Celula>
                </>
              ) : (
                <Celula largura="63%" estilo={[s.centro, s.pequeno]}>
                  Nenhum fornecedor cotou este item
                </Celula>
              )}
            </View>
          ))}
          <View style={s.linhaUltima} wrap={false}>
            <Text style={[s.tdTotal, { width: "86%", textAlign: "right" }]}>Total da melhor combinação</Text>
            <Text style={[s.tdTotal, { width: "14%", textAlign: "right", color: cor.verde }]}>{formatMoeda(analise.melhorCombinacao)}</Text>
          </View>
        </View>

        {analise.pedidosPorFornecedor.length > 0 && (
          <View wrap={false}>
            <Text style={s.secao}>Pedido sugerido por fornecedor</Text>
            <View style={s.pedidos}>
              {analise.pedidosPorFornecedor.map((p) => {
                const r = cotacao.respostas.find((x) => x.id === p.respostaId)!;
                return (
                  <View key={p.respostaId} style={s.pedido}>
                    <View style={s.pedidoTopo}>
                      <Text style={[s.negrito, { maxWidth: "65%" }]}>{p.fornecedor}</Text>
                      <Text style={[s.negrito, { color: cor.marca }]}>{formatMoeda(p.total)}</Text>
                    </View>
                    {p.itens.map((l) => (
                      <Text key={l.item.id} style={{ fontSize: 7.5, marginBottom: 1.5 }}>
                        {l.item.produto.nome} — {formatNumero(l.item.quantidade)} {l.item.produto.unidade}: {formatMoeda(l.melhor!.total)}
                      </Text>
                    ))}
                    <Text style={[s.pequeno, { marginTop: 3 }]}>
                      {[r.entregaImediata ? "Entrega imediata" : r.prazoEntrega ? `Prazo ${r.prazoEntrega}` : null, r.condicaoPagamento, r.telefone ? formatTelefone(r.telefone) : null]
                        .filter(Boolean)
                        .join("  ·  ")}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {blocos.map((bloco, indice) => {
          const larguraItem = 26;
          const larguraForn = (100 - larguraItem) / bloco.length;
          return (
            <View key={indice} break={indice === 0 ? analise.itens.length > 12 : true}>
              <Text style={s.secao}>
                Comparativo completo{blocos.length > 1 ? ` (parte ${indice + 1} de ${blocos.length})` : ""}
              </Text>
              <View style={s.tabela}>
                <View style={s.linha} fixed>
                  <Cabecalho largura={`${larguraItem}%`}>Item</Cabecalho>
                  {bloco.map((f) => (
                    <View key={f.resposta.id} style={[s.th, { width: `${larguraForn}%` }]}>
                      <Text style={{ textAlign: "center", color: cor.texto }}>{f.resposta.nomeFornecedor}</Text>
                      <Text style={{ textAlign: "center", fontFamily: "Helvetica", textTransform: "none", marginTop: 1 }}>
                        {f.resposta.entregaImediata ? "Entrega imediata" : `Prazo ${f.resposta.prazoEntrega || "-"}`} · {f.resposta.condicaoPagamento || "pgto a combinar"}
                      </Text>
                    </View>
                  ))}
                </View>
                {analise.itens.map(({ item, ofertas, melhor }) => (
                  <View key={item.id} style={s.linha} wrap={false}>
                    <View style={[s.td, { width: `${larguraItem}%` }]}>
                      <Text style={s.negrito}>{item.produto.nome}</Text>
                      <Text style={s.pequeno}>
                        {formatNumero(item.quantidade)} {item.produto.unidade}
                      </Text>
                    </View>
                    {bloco.map((f) => {
                      const o = ofertas.find((x) => x.respostaId === f.resposta.id);
                      const best = o && melhor?.respostaId === o.respostaId;
                      return (
                        <View key={f.resposta.id} style={[s.td, { width: `${larguraForn}%` }, best ? s.melhorCelula : {}]}>
                          {o ? (
                            <>
                              {o.desconto > 0 ? <Text style={[s.riscado, s.centro]}>{formatMoeda(o.precoUnitario)}</Text> : null}
                              <Text style={[s.centro, best ? s.verde : s.negrito]}>{formatMoeda(o.precoFinal)}</Text>
                              <Text style={[s.pequeno, s.centro]}>
                                {o.marca ? `${o.marca} · ` : ""}total {formatMoeda(o.total)}
                              </Text>
                              {o.estoqueInsuficiente ? (
                                <Text style={[s.pequeno, s.centro, { color: cor.laranja }]}>estoque: {formatNumero(o.quantidadeDisponivel)}</Text>
                              ) : null}
                            </>
                          ) : (
                            <Text style={[s.centro, s.pequeno]}>-</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
                <View style={s.linhaUltima} wrap={false}>
                  <Text style={[s.tdTotal, { width: `${larguraItem}%` }]}>Total do fornecedor</Text>
                  {bloco.map((f) => (
                    <View key={f.resposta.id} style={[s.tdTotal, { width: `${larguraForn}%` }]}>
                      {f.descontoGeral > 0 ? (
                        <Text style={[s.pequeno, s.centro]}>
                          {formatMoeda(f.soma)} - desc. {formatMoeda(f.descontoGeral)}
                        </Text>
                      ) : null}
                      <Text style={[s.centro, analise.melhorUnico?.resposta.id === f.resposta.id ? { color: cor.verde } : {}]}>{formatMoeda(f.total)}</Text>
                      <Text style={[s.pequeno, s.centro, { fontFamily: "Helvetica" }]}>
                        {f.completo ? "todos os itens" : `${f.cotados} de ${cotacao.itens.length} itens`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        <View style={s.rodape} fixed>
          <Text>
            {empresa} · Cotação Nº {numero} · Valores informados pelos fornecedores. Preço final = preço unitário - desconto por unidade.
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Gerado por ${MARCA.nome} · página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
