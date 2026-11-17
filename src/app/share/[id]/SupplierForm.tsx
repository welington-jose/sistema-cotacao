"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { submitFornecedorResposta } from "../../actions/cotacoes";
import { apenasDigitos, cnpjValido, formatMoeda, formatNumero, parseValor } from "@/lib/format";
import Icone from "@/components/Icone";

type Item = { id: string; quantidade: number; marca: string | null; nome: string; unidade: string; descricao: string | null };

type RespostaItem = { preco: string; desconto: string; marca: string; atendeTotal: boolean; disponivel: string };

const CHAVE_FORNECEDOR = "fornecedor:dados";
const PAGAMENTOS = ["À vista", "PIX", "Boleto 7 dias", "Boleto 14 dias", "Boleto 28 dias", "30 dias", "30/60 dias", "30/60/90 dias", "Cartão de crédito"];

function mascaraCnpj(v: string) {
  const d = apenasDigitos(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function mascaraTelefone(v: string) {
  const d = apenasDigitos(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

const vazio: RespostaItem = { preco: "", desconto: "", marca: "", atendeTotal: true, disponivel: "" };

export default function SupplierForm({ cotacaoId, itens, empresaCompradora }: { cotacaoId: string; itens: Item[]; empresaCompradora: string }) {
  const [cnpj, setCnpj] = useState("");
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [entregaImediata, setEntregaImediata] = useState(false);
  const [prazoDias, setPrazoDias] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [descontoGeral, setDescontoGeral] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [respostas, setRespostas] = useState<Record<string, RespostaItem>>({});
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviado, setEnviado] = useState<{ total: number; itens: number } | null>(null);
  const [enviando, startEnvio] = useTransition();

  // Lembra os dados da empresa do fornecedor neste aparelho.
  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE_FORNECEDOR) || "null");
      if (salvo) {
        setCnpj(salvo.cnpj || "");
        setNome(salvo.nome || "");
        setTelefone(salvo.telefone || "");
        setEmail(salvo.email || "");
        setPagamento(salvo.pagamento || "");
      }
    } catch {}
  }, []);

  const r = (id: string) => respostas[id] ?? vazio;

  function alterar(id: string, campo: keyof RespostaItem, valor: string | boolean) {
    setRespostas((atual) => ({ ...atual, [id]: { ...(atual[id] ?? vazio), [campo]: valor } }));
  }

  const calculo = useMemo(() => {
    let soma = 0;
    let cotados = 0;
    for (const item of itens) {
      const resp = respostas[item.id];
      const preco = parseValor(resp?.preco ?? "");
      if (!preco || preco <= 0) continue;
      const desconto = Math.min(parseValor(resp?.desconto ?? "") ?? 0, preco);
      soma += (preco - desconto) * item.quantidade;
      cotados++;
    }
    const total = Math.max(0, soma - (parseValor(descontoGeral) ?? 0));
    return { soma, total, cotados };
  }, [respostas, itens, descontoGeral]);

  async function buscarCnpj() {
    setAviso("");
    const d = apenasDigitos(cnpj);
    if (!cnpjValido(d)) {
      setAviso("CNPJ inválido. Confira os números.");
      return;
    }
    setBuscandoCnpj(true);
    try {
      const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`);
      if (!resp.ok) throw new Error();
      const dados = await resp.json();
      setNome(dados.nome_fantasia || dados.razao_social || nome);
      if (!telefone && dados.ddd_telefone_1) setTelefone(mascaraTelefone(dados.ddd_telefone_1));
      if (!email && dados.email) setEmail(String(dados.email).toLowerCase());
      setAviso("Dados preenchidos pelo CNPJ. Confira antes de enviar.");
    } catch {
      setAviso("Não encontramos este CNPJ agora. Preencha o nome manualmente.");
    } finally {
      setBuscandoCnpj(false);
    }
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) return setErro("Informe o nome da sua empresa.");
    if (!telefone.trim() && !email.trim()) return setErro("Informe um telefone/WhatsApp ou e-mail para o comprador falar com você.");
    if (!entregaImediata && !prazoDias) return setErro("Informe o prazo de entrega em dias ou marque “Entrega imediata”.");
    if (calculo.cotados === 0) return setErro("Informe o preço de pelo menos um item.");
    const semEstoque = itens.find((i) => {
      const x = respostas[i.id];
      return x && parseValor(x.preco) && !x.atendeTotal && !parseValor(x.disponivel);
    });
    if (semEstoque) return setErro(`Informe quanto você tem em estoque de “${semEstoque.nome}”.`);

    startEnvio(async () => {
      const resultado = await submitFornecedorResposta(cotacaoId, {
        nomeFornecedor: nome,
        cnpj,
        email,
        telefone,
        observacoes,
        entregaImediata,
        prazoEntrega: entregaImediata ? "Imediata" : `${prazoDias} dia(s)`,
        condicaoPagamento: pagamento,
        descontoGlobal: descontoGeral,
        itens: itens.map((i) => {
          const x = r(i.id);
          return {
            cotacaoItemId: i.id,
            marca: x.marca,
            precoUnitario: x.preco,
            descontoItem: x.desconto,
            atendeTotalPedido: x.atendeTotal,
            quantidadeDisponivel: x.atendeTotal ? i.quantidade : x.disponivel,
          };
        }),
      });

      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      try {
        localStorage.setItem(CHAVE_FORNECEDOR, JSON.stringify({ cnpj, nome, telefone, email, pagamento }));
      } catch {}
      setEnviado({ total: calculo.total, itens: calculo.cotados });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (enviado) {
    return (
      <div className="card animate-fade-in">
        <div className="empty-state">
          <div className="empty-state__icon" style={{ background: "var(--success-100)", color: "var(--success-700)" }}>
            <Icone nome="checkCirculo" tamanho={28} />
          </div>
          <h3>Proposta enviada!</h3>
          <p>
            {empresaCompradora} recebeu sua proposta de <strong>{formatMoeda(enviado.total)}</strong> para {enviado.itens} item(ns). Se for
            escolhido, o comprador entra em contato pelo telefone ou e-mail informado.
          </p>
          <p className="text-sm">Obrigado pela participação.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate>
      <div className="card mb-6">
        <div className="card__header">
          <div className="card__title">
            <span className="step-number">1</span> Dados da sua empresa
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label className="input-label" htmlFor="cnpj">
              CNPJ <span className="opcional">(preenche os dados sozinho)</span>
            </label>
            <div className="row-nowrap">
              <input id="cnpj" className="input-field" inputMode="numeric" placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(mascaraCnpj(e.target.value))} onBlur={() => apenasDigitos(cnpj).length === 14 && !nome && buscarCnpj()} />
              <button type="button" className="btn btn--outline" onClick={buscarCnpj} disabled={buscandoCnpj || apenasDigitos(cnpj).length !== 14}>
                {buscandoCnpj ? <span className="spinner" /> : <Icone nome="busca" tamanho={16} />} Buscar
              </button>
            </div>
            {aviso && <span className="input-hint">{aviso}</span>}
          </div>
          <div className="field">
            <label className="input-label" htmlFor="nome">Nome da empresa *</label>
            <input id="nome" className="input-field" placeholder="Nome fantasia" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={150} required />
          </div>
          <div className="field">
            <label className="input-label" htmlFor="tel">Telefone / WhatsApp</label>
            <input id="tel" className="input-field" inputMode="tel" placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(mascaraTelefone(e.target.value))} />
          </div>
          <div className="field">
            <label className="input-label" htmlFor="email">E-mail</label>
            <input id="email" type="email" className="input-field" placeholder="vendas@suaempresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150} />
          </div>
        </div>

        <div className="form-row-3">
          <div className="field">
            <label className="input-label" htmlFor="prazo">Prazo de entrega</label>
            <div className="input-addon">
              <span>dias</span>
              <input id="prazo" className="input-field" inputMode="numeric" placeholder={entregaImediata ? "Imediata" : "Ex.: 3"} value={entregaImediata ? "" : prazoDias} disabled={entregaImediata} onChange={(e) => setPrazoDias(apenasDigitos(e.target.value).slice(0, 3))} />
            </div>
            <label className="checkbox mt-1">
              <input type="checkbox" checked={entregaImediata} onChange={(e) => setEntregaImediata(e.target.checked)} /> Entrega imediata
            </label>
          </div>
          <div className="field">
            <label className="input-label" htmlFor="pgto">Condição de pagamento</label>
            <input id="pgto" className="input-field" list="pagamentos" placeholder="Ex.: 30/60 dias" value={pagamento} onChange={(e) => setPagamento(e.target.value)} maxLength={120} />
            <datalist id="pagamentos">
              {PAGAMENTOS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label className="input-label" htmlFor="desc">
              Desconto no total <span className="opcional">(opcional)</span>
            </label>
            <div className="input-addon">
              <span>R$</span>
              <input id="desc" className="input-field input-field--money" inputMode="decimal" placeholder="0,00" value={descontoGeral} onChange={(e) => setDescontoGeral(e.target.value)} />
            </div>
            <span className="input-hint">Se fechar o pedido completo.</span>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card__header">
          <div>
            <div className="card__title">
              <span className="step-number">2</span> Seus preços
            </div>
            <div className="card__subtitle">Preço por unidade. O desconto também é por unidade. Use vírgula para os centavos.</div>
          </div>
          <span className="badge badge--brand">
            {calculo.cotados} de {itens.length}
          </span>
        </div>

        <div className="stack-sm">
          {itens.map((item) => {
            const x = r(item.id);
            const preco = parseValor(x.preco);
            const desconto = Math.min(parseValor(x.desconto) ?? 0, preco ?? 0);
            const subtotal = preco ? (preco - desconto) * item.quantidade : 0;
            return (
              <div key={item.id} className={`supplier-item ${preco ? "supplier-item--filled" : ""}`}>
                <div>
                  <div className="supplier-item__name">{item.nome}</div>
                  <div className="supplier-item__qty">
                    Quantidade: <strong>{formatNumero(item.quantidade)} {item.unidade}</strong>
                  </div>
                  {item.marca && <div className="text-xs text-brand mt-1">Marca preferida: {item.marca}</div>}
                  {item.descricao && <div className="text-xs text-muted mt-1">{item.descricao}</div>}
                </div>
                <div className="field">
                  <label className="input-label" htmlFor={`m-${item.id}`}>Marca ofertada</label>
                  <input id={`m-${item.id}`} className="input-field input-field--sm" placeholder={item.marca || "Marca"} value={x.marca} onChange={(e) => alterar(item.id, "marca", e.target.value)} maxLength={80} />
                  <label className="checkbox mt-1" style={{ fontSize: "0.8rem" }}>
                    <input type="checkbox" checked={x.atendeTotal} onChange={(e) => alterar(item.id, "atendeTotal", e.target.checked)} /> Tenho a quantidade toda
                  </label>
                  {!x.atendeTotal && (
                    <input className="input-field input-field--sm mt-1" inputMode="decimal" placeholder={`Quanto tem (${item.unidade})`} value={x.disponivel} onChange={(e) => alterar(item.id, "disponivel", e.target.value)} aria-label="Quantidade em estoque" />
                  )}
                </div>
                <div className="field">
                  <label className="input-label" htmlFor={`p-${item.id}`}>Preço unit. (R$)</label>
                  <input id={`p-${item.id}`} className="input-field input-field--sm input-field--money" inputMode="decimal" placeholder="0,00" value={x.preco} onChange={(e) => alterar(item.id, "preco", e.target.value)} />
                </div>
                <div className="field">
                  <label className="input-label" htmlFor={`d-${item.id}`}>Desconto/un. (R$)</label>
                  <input id={`d-${item.id}`} className="input-field input-field--sm input-field--money" inputMode="decimal" placeholder="0,00" value={x.desconto} onChange={(e) => alterar(item.id, "desconto", e.target.value)} />
                </div>
                <div className="field">
                  <span className="input-label">Subtotal</span>
                  <div className="fw-700 tabular" style={{ padding: "0.45rem 0", textAlign: "right" }}>
                    {preco ? formatMoeda(subtotal) : <span className="text-muted">—</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="field mt-4" style={{ marginBottom: 0 }}>
          <label className="input-label" htmlFor="obs">
            Observações <span className="opcional">(opcional)</span>
          </label>
          <textarea id="obs" className="input-field" rows={2} placeholder="Validade da proposta, frete, condições especiais..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={1000} />
        </div>
      </div>

      <div className="total-bar">
        <div>
          <div className="total-bar__label">
            Total da proposta ({calculo.cotados} de {itens.length} itens)
            {parseValor(descontoGeral) ? ` · com desconto de ${formatMoeda(parseValor(descontoGeral))}` : ""}
          </div>
          <div className="total-bar__value">{formatMoeda(calculo.total)}</div>
        </div>
        <div className="stack-sm" style={{ alignItems: "stretch" }}>
          {erro && (
            <div className="alert alert--error" style={{ padding: "0.5rem 0.75rem" }}>
              <Icone nome="alerta" tamanho={16} /> <div>{erro}</div>
            </div>
          )}
          <button type="submit" className="btn btn--lg" disabled={enviando}>
            {enviando ? <span className="spinner" /> : <Icone nome="enviar" />} Enviar proposta
          </button>
        </div>
      </div>
    </form>
  );
}
