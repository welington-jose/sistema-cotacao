"use client";

import { useState } from "react";
import { createCotacao } from "../../actions/cotacoes";

type Produto = {
  id: string;
  nome: string;
  unidade: string | null;
};

type ItemCotacao = {
  produtoId: string;
  nome: string;
  quantidade: number;
  unidade: string;
  marca?: string;
};

export default function NewCotacaoClient({ produtos }: { produtos: Produto[] }) {
  const [titulo, setTitulo] = useState("");
  const [itens, setItens] = useState<ItemCotacao[]>([]);
  const [selectedProduto, setSelectedProduto] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [marcaDesejada, setMarcaDesejada] = useState("");

  const handleAddItem = () => {
    if (!selectedProduto || !quantidade || parseFloat(quantidade) <= 0) return;
    
    const prod = produtos.find(p => p.id === selectedProduto);
    if (!prod) return;

    // Check if already exists
    if (itens.find(i => i.produtoId === selectedProduto)) {
      alert("Produto já adicionado.");
      return;
    }

    setItens([...itens, {
      produtoId: prod.id,
      nome: prod.nome,
      unidade: prod.unidade || 'un',
      quantidade: parseFloat(quantidade),
      marca: marcaDesejada || undefined
    }]);

    setSelectedProduto("");
    setQuantidade("");
    setMarcaDesejada("");
  };

  const handleRemoveItem = (id: string) => {
    setItens(itens.filter(i => i.produtoId !== id));
  };

  const handleSubmit = async () => {
    if (!titulo || itens.length === 0) {
      alert("Preencha o título e adicione pelo menos um item.");
      return;
    }
    
    await createCotacao({
      titulo,
      itens: itens.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade, marca: i.marca }))
    });
  };

  return (
    <div className="grid-cols-2">
      <div>
        <div className="glass-panel">
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
          <div className="input-group mt-4">
            <label className="input-label">Produto</label>
            <select 
              className="input-field"
              value={selectedProduto}
              onChange={(e) => setSelectedProduto(e.target.value)}
            >
              <option value="">Selecione um produto</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
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

          <button onClick={handleAddItem} className="btn btn--outline mt-2 w-full">
            + Adicionar à Lista
          </button>
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
                    <td colSpan={3} className="text-center">Nenhum item adicionado.</td>
                  </tr>
                ) : (
                  itens.map(item => (
                    <tr key={item.produtoId}>
                      <td>{item.nome}</td>
                      <td>{item.marca || '-'}</td>
                      <td>{item.quantidade} <span className="badge">{item.unidade}</span></td>
                      <td>
                        <button 
                          onClick={() => handleRemoveItem(item.produtoId)}
                          className="btn btn--danger btn--outline" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
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
            style={{ opacity: (itens.length === 0 || !titulo) ? 0.5 : 1 }}
          >
            Gerar Link de Cotação
          </button>
        </div>
      </div>
    </div>
  );
}
