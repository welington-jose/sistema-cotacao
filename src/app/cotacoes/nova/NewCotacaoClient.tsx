"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createCotacao } from "../../actions/cotacoes";
import { criarProdutoRapido } from "../../actions/produtos";
import { UNIDADES } from "@/lib/unidades";
import { parseValor } from "@/lib/format";
import Icone from "@/components/Icone";

type Produto = { id: string; nome: string; unidade: string; descricao: string | null; usos: number };

type Item = { produtoId: string; nome: string; unidade: string; quantidade: string; marca: string };

type Rascunho = { titulo: string; observacoes: string; prazoResposta: string; itens: Item[] };

const CHAVE_RASCUNHO = "cotacaoRascunho:v2";

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function NewCotacaoClient({ produtos: produtosIniciais }: { produtos: Produto[] }) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [titulo, setTitulo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [prazoResposta, setPrazoResposta] = useState("");
  const [itens, setItens] = useState<Item[]>([]);
  const [busca, setBusca] = useState("");
  const [unidadeNova, setUnidadeNova] = useState("un");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregado, setCarregado] = useState(false);
  const [enviando, startEnvio] = useTransition();
  const [criando, startCriacao] = useTransition();

  // Restaura o rascunho salvo automaticamente neste navegador (só existe no navegador, por isso no efeito).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_RASCUNHO);
      if (salvo) {
        const r = JSON.parse(salvo) as Rascunho;
        const ids = new Set(produtosIniciais.map((p) => p.id));
        const itensValidos = (r.itens || []).filter((i) => ids.has(i.produtoId));
        if (r.titulo || itensValidos.length) {
          setTitulo(r.titulo || "");
          setObservacoes(r.observacoes || "");
          setPrazoResposta(r.prazoResposta || "");
          setItens(itensValidos);
          setAviso("Rascunho restaurado. Continue de onde parou.");
        }
      }
    } catch {
      localStorage.removeItem(CHAVE_RASCUNHO);
    }
    setCarregado(true);
  }, [produtosIniciais]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ titulo, observacoes, prazoResposta, itens } satisfies Rascunho));
    } catch {}
  }, [titulo, observacoes, prazoResposta, itens, carregado]);

  const selecionados = useMemo(() => new Set(itens.map((i) => i.produtoId)), [itens]);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return produtos;
    return produtos.filter((p) => normalizar(p.nome).includes(termo) || normalizar(p.descricao || "").includes(termo));
  }, [produtos, busca]);

  const existeExato = produtos.some((p) => normalizar(p.nome) === normalizar(busca.trim()));

  function alternar(p: Produto) {
    setErro("");
    setItens((atual) =>
      atual.some((i) => i.produtoId === p.id)
        ? atual.filter((i) => i.produtoId !== p.id)
        : [...atual, { produtoId: p.id, nome: p.nome, unidade: p.unidade, quantidade: "", marca: "" }],
    );
  }

  function atualizarItem(id: string, campo: "quantidade" | "marca", valor: string) {
    setItens((atual) => atual.map((i) => (i.produtoId === id ? { ...i, [campo]: valor } : i)));
  }

  function cadastrarRapido() {
    const nome = busca.trim();
    if (!nome) return;
    startCriacao(async () => {
      try {
        const novo = await criarProdutoRapido(nome, unidadeNova);
        const produto = { id: novo.id, nome: novo.nome, unidade: novo.unidade || "un", descricao: null, usos: 0 };
        setProdutos((atual) => [produto, ...atual]);
        setItens((atual) => [...atual, { produtoId: produto.id, nome: produto.nome, unidade: produto.unidade, quantidade: "", marca: "" }]);
        setBusca("");
        setAviso(`“${produto.nome}” cadastrado e adicionado à cotação.`);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível cadastrar o produto.");
      }
    });
  }

  function descartar() {
    if (!confirm("Descartar este rascunho e começar do zero?")) return;
    setTitulo("");
    setObservacoes("");
    setPrazoResposta("");
    setItens([]);
    setAviso("");
    localStorage.removeItem(CHAVE_RASCUNHO);
  }

  function enviar() {
    setErro("");
    if (!titulo.trim()) return setErro("Dê um título para a cotação (ex.: Compras da semana, Obra Centro).");
    if (itens.length === 0) return setErro("Adicione pelo menos um produto.");
    const semQtd = itens.find((i) => !parseValor(i.quantidade) || (parseValor(i.quantidade) ?? 0) <= 0);
    if (semQtd) return setErro(`Informe a quantidade de “${semQtd.nome}”.`);

    startEnvio(async () => {
      try {
        localStorage.removeItem(CHAVE_RASCUNHO);
        await createCotacao({
          titulo,
          observacoes,
          prazoResposta: prazoResposta || undefined,
          itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: parseValor(i.quantidade) ?? 0, marca: i.marca || undefined })),
        });
      } catch (e) {
        // redirect() do Next também passa por aqui; só mostra erros reais.
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
          setErro(e.message);
          localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ titulo, observacoes, prazoResposta, itens }));
        } else {
          throw e;
        }
      }
    });
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid-main-aside">
      <div className="stack">
        <div className="card">
          <div className="card__header">
            <div className="card__title">
              <span className="step-number">1</span> Dados da cotação
            </div>
          </div>
          <div className="field">
            <label className="input-label" htmlFor="titulo">Título</label>
            <input
              id="titulo"
              className="input-field"
              placeholder="Ex.: Materiais para a obra do Centro"
              value={titulo}
              maxLength={120}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label className="input-label" htmlFor="prazo">
                Prazo para os fornecedores responderem <span className="opcional">(opcional)</span>
              </label>
              <input id="prazo" type="date" min={hoje} className="input-field" value={prazoResposta} onChange={(e) => setPrazoResposta(e.target.value)} />
            </div>
            <div className="field">
              <label className="input-label" htmlFor="obs">
                Observações para o fornecedor <span className="opcional">(opcional)</span>
              </label>
              <input
                id="obs"
                className="input-field"
                placeholder="Ex.: entrega na Rua X, nota fiscal no CNPJ..."
                value={observacoes}
                maxLength={1000}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <div className="card__title">
                <span className="step-number">2</span> Escolha os produtos
              </div>
              <div className="card__subtitle">Clique para adicionar ou remover. Os mais usados aparecem primeiro.</div>
            </div>
            <span className="badge badge--brand">{produtos.length} no catálogo</span>
          </div>

          <div className="input-search mb-3">
            <Icone nome="busca" tamanho={17} />
            <input
              className="input-field"
              placeholder="Buscar produto pelo nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar produto"
            />
          </div>

          <div className="scroll-list">
            {filtrados.map((p) => {
              const marcado = selecionados.has(p.id);
              return (
                <button key={p.id} type="button" className="select-item" aria-pressed={marcado} onClick={() => alternar(p)}>
                  <span className="select-item__check">{marcado && <Icone nome="check" tamanho={14} espessura={3} />}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="fw-600 truncate" style={{ display: "block" }}>{p.nome}</span>
                    {p.descricao && <span className="text-xs text-muted truncate" style={{ display: "block" }}>{p.descricao}</span>}
                  </span>
                  {p.usos > 0 && <span className="text-xs text-muted nowrap">{p.usos}× cotado</span>}
                  <span className="badge">{p.unidade}</span>
                </button>
              );
            })}

            {filtrados.length === 0 && !busca && (
              <div className="text-center text-muted text-sm" style={{ padding: "1.5rem" }}>
                Seu catálogo está vazio. Digite o nome de um produto acima para cadastrar.
              </div>
            )}
          </div>

          {busca.trim() && !existeExato && (
            <div className="card card--muted mt-3" style={{ padding: "0.85rem 1rem" }}>
              <div className="text-sm mb-2">
                {filtrados.length === 0 ? "Nenhum produto encontrado. " : ""}Cadastrar <strong>“{busca.trim()}”</strong> no catálogo:
              </div>
              <div className="row-nowrap">
                <select className="input-field input-field--sm" style={{ maxWidth: 190 }} value={unidadeNova} onChange={(e) => setUnidadeNova(e.target.value)} aria-label="Unidade">
                  {UNIDADES.map((u) => (
                    <option key={u.valor} value={u.valor}>{u.rotulo}</option>
                  ))}
                </select>
                <button type="button" className="btn btn--sm" onClick={cadastrarRapido} disabled={criando}>
                  {criando ? <span className="spinner" /> : <Icone nome="mais" tamanho={15} />} Cadastrar e adicionar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky-top">
        <div className="card card--flush">
          <div className="card__header card__header--bordered">
            <div className="card__title">
              <span className="step-number">3</span> Itens da cotação
            </div>
            <span className="badge badge--brand">{itens.length}</span>
          </div>

          {itens.length === 0 ? (
            <div className="empty-state" style={{ padding: "2.25rem 1.25rem" }}>
              <div className="empty-state__icon">
                <Icone nome="caixa" tamanho={24} />
              </div>
              <p style={{ marginBottom: 0 }}>Os produtos que você escolher aparecem aqui para informar a quantidade.</p>
            </div>
          ) : (
            <div className="list" style={{ maxHeight: "52vh", overflowY: "auto" }}>
              {itens.map((i) => (
                <div key={i.produtoId} className="list-item" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem" }}>
                  <div className="row-nowrap">
                    <strong className="truncate" style={{ flex: 1 }}>{i.nome}</strong>
                    <button type="button" className="btn btn--ghost btn--icon" aria-label={`Remover ${i.nome}`} onClick={() => setItens((a) => a.filter((x) => x.produtoId !== i.produtoId))}>
                      <Icone nome="lixo" tamanho={16} />
                    </button>
                  </div>
                  <div className="row-nowrap">
                    <div className="input-addon" style={{ flex: "0 0 150px" }}>
                      <span>{i.unidade}</span>
                      <input
                        className="input-field input-field--sm"
                        inputMode="decimal"
                        placeholder="Qtd."
                        value={i.quantidade}
                        onChange={(e) => atualizarItem(i.produtoId, "quantidade", e.target.value)}
                        aria-label={`Quantidade de ${i.nome}`}
                      />
                    </div>
                    <input
                      className="input-field input-field--sm"
                      placeholder="Marca preferida (opcional)"
                      value={i.marca}
                      maxLength={80}
                      onChange={(e) => atualizarItem(i.produtoId, "marca", e.target.value)}
                      aria-label={`Marca de ${i.nome}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card__footer stack-sm">
            {erro && (
              <div className="alert alert--error">
                <Icone nome="alerta" /> <div>{erro}</div>
              </div>
            )}
            {aviso && !erro && <div className="text-xs text-muted">{aviso}</div>}
            <button type="button" className="btn btn--lg btn--block" onClick={enviar} disabled={enviando}>
              {enviando ? <span className="spinner" /> : <Icone nome="enviar" />} Criar cotação e gerar link
            </button>
            {(itens.length > 0 || titulo) && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={descartar}>
                Descartar rascunho
              </button>
            )}
            <div className="text-xs text-muted text-center">O rascunho fica salvo automaticamente neste navegador.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
