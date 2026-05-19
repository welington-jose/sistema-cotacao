"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createCotacao } from "../../actions/cotacoes";

type Produto = {
  id: string;
  nome: string;
  unidade: string | null;
  _count: {
    itensCotacao: number;
  };
};

type ItemCotacao = {
  produtoId: string;
  nome: string;
  quantidade: number;
  unidade: string;
  marca?: string;
};

type Draft = {
  id: string;
  titulo: string;
  itens: ItemCotacao[];
  searchQuery: string;
  selectedProdutos: string[];
  quantidade: string;
  marcaDesejada: string;
  updatedAt: string;
};

const CURRENT_DRAFT_KEY = "cotacaoDraft";
const SAVED_DRAFTS_KEY = "cotacaoDrafts";

function readCurrentDraft() {
  if (typeof window === "undefined") return null;

  const savedDraft = window.localStorage.getItem(CURRENT_DRAFT_KEY);
  if (!savedDraft) return null;

  try {
    return JSON.parse(savedDraft) as Draft;
  } catch {
    window.localStorage.removeItem(CURRENT_DRAFT_KEY);
    return null;
  }
}

function readSavedDrafts() {
  if (typeof window === "undefined") return [];

  const savedDrafts = window.localStorage.getItem(SAVED_DRAFTS_KEY);
  if (!savedDrafts) return [];

  try {
    return JSON.parse(savedDrafts) as Draft[];
  } catch {
    window.localStorage.removeItem(SAVED_DRAFTS_KEY);
    return [];
  }
}

export default function NewCotacaoClient({ produtos }: { produtos: Produto[] }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [itens, setItens] = useState<ItemCotacao[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [quantidade, setQuantidade] = useState("");
  const [marcaDesejada, setMarcaDesejada] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentDraft = readCurrentDraft();
    const savedDrafts = readSavedDrafts();

    if (currentDraft) {
      setTitulo(currentDraft.titulo);
      setItens(currentDraft.itens);
      setSelectedProdutos(currentDraft.selectedProdutos);
      setQuantidade(currentDraft.quantidade);
      setMarcaDesejada(currentDraft.marcaDesejada);
      setSearchQuery(currentDraft.searchQuery);
      setLoadedDraftId(currentDraft.id);
      setMessage("Rascunho restaurado automaticamente.");
    }

    setDrafts(savedDrafts);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const draft = {
      id: loadedDraftId ?? new Date().toISOString(),
      titulo,
      itens,
      searchQuery,
      selectedProdutos,
      quantidade,
      marcaDesejada,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(draft));
  }, [titulo, itens, searchQuery, selectedProdutos, quantidade, marcaDesejada, loadedDraftId]);

  const filteredProdutos = useMemo(
    () => produtos.filter((produto) => produto.nome.toLowerCase().includes(searchQuery.toLowerCase())),
    [produtos, searchQuery]
  );

  const visibleProdutos = useMemo(() => {
    const sorted = filteredProdutos.slice().sort((a, b) => {
      if (a._count.itensCotacao === b._count.itensCotacao) {
        return a.nome.localeCompare(b.nome);
      }
      return b._count.itensCotacao - a._count.itensCotacao;
    });
    return searchQuery.trim() ? sorted : sorted.slice(0, 4);
  }, [filteredProdutos, searchQuery]);

  const toggleProdutoSelection = (id: string) => {
    setSelectedProdutos((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleAddItems = () => {
    if (selectedProdutos.length === 0) {
      alert("Selecione um ou mais produtos antes de adicionar.");
      return;
    }

    if (!quantidade || parseFloat(quantidade) <= 0) {
      alert("Informe uma quantidade válida.");
      return;
    }

    const amount = parseFloat(quantidade);
    const additions = selectedProdutos
      .map((produtoId) => produtos.find((p) => p.id === produtoId))
      .filter((prod): prod is Produto => Boolean(prod))
      .map((prod) => ({
        produtoId: prod.id,
        nome: prod.nome,
        unidade: prod.unidade || "un",
        quantidade: amount,
        marca: marcaDesejada || undefined,
      }));

    setItens((current) => {
      const merged = [...current];
      additions.forEach((item) => {
        const index = merged.findIndex((existing) => existing.produtoId === item.produtoId);
        if (index >= 0) {
          merged[index] = { ...merged[index], quantidade: item.quantidade, marca: item.marca ?? merged[index].marca };
        } else {
          merged.push(item);
        }
      });
      return merged;
    });

    setSelectedProdutos([]);
    setQuantidade("");
    setMarcaDesejada("");
    setMessage("Itens adicionados à cotação. Você pode alterar quantidades na lista abaixo.");
  };

  const handleRemoveItem = (id: string) => {
    setItens((current) => current.filter((i) => i.produtoId !== id));
  };

  const handleUpdateItemQuantidade = (id: string, value: string) => {
    const parsed = parseFloat(value);
    if (value === "" || Number.isNaN(parsed) || parsed < 0) {
      return;
    }
    setItens((current) =>
      current.map((item) => (item.produtoId === id ? { ...item, quantidade: parsed } : item))
    );
  };

  const handleSaveDraft = () => {
    if (typeof window === "undefined") return;

    const draft: Draft = {
      id: loadedDraftId ?? new Date().toISOString(),
      titulo,
      itens,
      searchQuery,
      selectedProdutos,
      quantidade,
      marcaDesejada,
      updatedAt: new Date().toISOString(),
    };

    const nextDrafts = [draft, ...drafts.filter((d) => d.id !== draft.id)];
    setDrafts(nextDrafts);
    setLoadedDraftId(draft.id);
    window.localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(nextDrafts));
    window.localStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(draft));
    setMessage("Rascunho salvo com sucesso.");
  };

  const handleLoadDraft = (draft: Draft) => {
    setTitulo(draft.titulo);
    setItens(draft.itens);
    setSearchQuery(draft.searchQuery);
    setSelectedProdutos(draft.selectedProdutos);
    setQuantidade(draft.quantidade);
    setMarcaDesejada(draft.marcaDesejada);
    setLoadedDraftId(draft.id);
    setMessage("Rascunho carregado. Continue de onde parou.");
  };

  const handleDeleteDraft = (id: string) => {
    const nextDrafts = drafts.filter((draft) => draft.id !== id);
    setDrafts(nextDrafts);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(nextDrafts));
      if (loadedDraftId === id) {
        window.localStorage.removeItem(CURRENT_DRAFT_KEY);
        setLoadedDraftId(null);
      }
    }
  };

  const handleGoToCadastroProduto = () => {
    if (typeof window !== "undefined") {
      const currentDraft = {
        id: loadedDraftId ?? new Date().toISOString(),
        titulo,
        itens,
        searchQuery,
        selectedProdutos,
        quantidade,
        marcaDesejada,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(currentDraft));
    }
    router.push("/produtos?from=cotacao");
  };

  const handleSubmit = async () => {
    if (!titulo || itens.length === 0) {
      alert("Preencha o título e adicione pelo menos um item.");
      return;
    }

    await createCotacao({
      titulo,
      itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade, marca: i.marca })),
    });

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CURRENT_DRAFT_KEY);
      if (loadedDraftId) {
        const nextDrafts = drafts.filter((draft) => draft.id !== loadedDraftId);
        window.localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(nextDrafts));
      }
    }
  };

  return (
    <div className="grid-cols-2">
      <div>
        <div className="glass-panel mt-6">
          <h2>1. Detalhes da Cotação</h2>
          <div className="input-group mt-4">
            <label className="input-label">Título da Cotação</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: Materiais para Obra Centro"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <h2 className="mt-8">2. Adicionar Itens</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            Mostramos os 4 produtos mais usados. Use a busca para procurar outros produtos cadastrados.
          </p>
          <div className="input-group mt-4">
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
              <label className="input-label">Buscar produtos</label>
              <input
                type="text"
                className="input-field"
                placeholder="Digite para filtrar os produtos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              </div>
              <button
                type="button"
                className="btn btn--outline"
                onClick={handleGoToCadastroProduto}
                title="Cadastrar novo item"
                aria-label="Cadastrar novo item"
                style={{ minWidth: "44px", height: "42px", padding: "0 0.9rem", fontSize: "1.35rem", lineHeight: 1 }}
              >
                +
              </button>
            </div>
          </div>

          <div
            style={{
              maxHeight: "320px",
              overflowY: "auto",
              border: "1px solid var(--border-color)",
              borderRadius: "0.75rem",
              padding: "0.5rem",
              marginBottom: "1rem",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                {selectedProdutos.length ? `${selectedProdutos.length} item(s) selecionado(s)` : "Clique para selecionar produtos"}
              </span>
              {selectedProdutos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProdutos([])}
                  className="btn btn--outline"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                >
                  Limpar seleção
                </button>
              )}
            </div>
            {visibleProdutos.map((produto) => {
              const isSelected = selectedProdutos.includes(produto.id);
              return (
                <button
                  key={produto.id}
                  type="button"
                  onClick={() => toggleProdutoSelection(produto.id)}
                  className="product-list-item"
                  aria-pressed={isSelected}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "0.85rem 1rem",
                    border: isSelected ? "2px solid var(--color-brand-600)" : "1px solid var(--border-color)",
                    borderRadius: "0.75rem",
                    marginBottom: "0.5rem",
                    background: isSelected ? "#e0f2fe" : "transparent",
                    boxShadow: isSelected ? "0 0 0 3px rgba(59, 130, 246, 0.12)" : "none",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{produto.nome}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {isSelected && <span className="badge">Selecionado</span>}
                      <span className="badge">{produto.unidade || "un"}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="input-group">
            <label className="input-label">Quantidade</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Marca Desejada (Opcional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: Tigre, Amanco"
              value={marcaDesejada}
              onChange={(e) => setMarcaDesejada(e.target.value)}
            />
          </div>

          <button onClick={handleAddItems} className="btn btn--outline mt-2 w-full">
            + Adicionar itens selecionados
          </button>

          {message && (
            <p style={{ color: "var(--color-brand-600)", marginTop: "1rem" }}>{message}</p>
          )}
        </div>
      </div>

      <div>
        <div className="glass-panel">
          <h2>Itens Selecionados ({itens.length})</h2>

          <div className="table-wrapper mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Marca</th>
                  <th>Qtd</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center">
                      Nenhum item adicionado.
                    </td>
                  </tr>
                ) : (
                  itens.map((item) => (
                    <tr key={item.produtoId}>
                      <td>{item.nome}</td>
                      <td>{item.marca || "-"}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) => handleUpdateItemQuantidade(item.produtoId, e.target.value)}
                          className="input-field"
                          style={{ maxWidth: "100px" }}
                        />
                        <span className="badge" style={{ marginLeft: "0.5rem" }}>
                          {item.unidade}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleRemoveItem(item.produtoId)}
                          className="btn btn--danger btn--outline"
                          style={{
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.75rem",
                            minWidth: "80px",
                            display: "inline-flex",
                            justifyContent: "center",
                          }}
                          aria-label={`Remover ${item.nome}`}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button
            disabled={itens.length === 0 || !titulo}
            onClick={handleSubmit}
            className="btn mt-8 w-full"
            style={{ opacity: itens.length === 0 || !titulo ? 0.5 : 1 }}
          >
            Gerar Link de Cotação
          </button>
        </div>

        <div style={{ height: "1.5rem" }} />

        <div className="glass-panel">
          <h2>Rascunhos</h2>
          {drafts.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Não há rascunhos salvos ainda.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
              {drafts.map((draft) => (
                <div key={draft.id} style={{ border: "1px solid var(--border-color)", borderRadius: "0.75rem", padding: "0.85rem", background: "var(--bg-surface)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
                    <div>
                      <strong>{draft.titulo || "Rascunho sem título"}</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                        {draft.itens.length} item(s) • {new Date(draft.updatedAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="button" className="btn btn--outline" onClick={() => handleLoadDraft(draft)}>
                        Abrir
                      </button>
                      <button type="button" className="btn btn--danger btn--outline" onClick={() => handleDeleteDraft(draft.id)}>
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="btn btn--outline w-full" onClick={handleSaveDraft} style={{ marginTop: "0.5rem" }}>
            Salvar rascunho
          </button>
        </div>
      </div>
    </div>
  );
}
