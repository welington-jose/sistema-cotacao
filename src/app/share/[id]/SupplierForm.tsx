"use client";

import { useState } from "react";
import { submitFornecedorResposta } from "../../actions/cotacoes";

type ItemCotacao = {
  id: string;
  quantidade: number;
  produto: {
    nome: string;
    unidade: string | null;
  };
  marca?: string | null;
};

export default function SupplierForm({ cotacaoId, itens }: { cotacaoId: string, itens: ItemCotacao[] }) {
  const [cnpj, setCnpj] = useState("");
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [nomeFornecedor, setNomeFornecedor] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] = useState("");
  const [descontoGlobal, setDescontoGlobal] = useState("");
  
  const [respostasItens, setRespostasItens] = useState<{
    [key: string]: { precoUnitario: string, marca: string, descontoItem: string }
  }>({});

  const [submitted, setSubmitted] = useState(false);

  const buscarCnpj = async () => {
    const numbers = cnpj.replace(/\D/g, '');
    if (numbers.length !== 14) {
      alert("Por favor, digite um CNPJ válido com 14 números.");
      return;
    }
    
    setIsLoadingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numbers}`);
      if (res.ok) {
        const data = await res.json();
        if (data.nome_fantasia) {
          setNomeFornecedor(data.nome_fantasia);
        } else if (data.razao_social) {
          setNomeFornecedor(data.razao_social);
        }
      } else {
        alert("CNPJ não encontrado ou inválido.");
      }
    } catch {
      alert("Erro de conexão ao buscar o CNPJ.");
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const handleItemChange = (itemId: string, field: string, value: string) => {
    setRespostasItens(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId] || { precoUnitario: "", marca: "", descontoItem: "" },
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFornecedor) {
      alert("Por favor, preencha o Nome da sua Empresa.");
      return;
    }

    const payloadItens = itens.map(item => ({
      cotacaoItemId: item.id,
      marca: respostasItens[item.id]?.marca || "",
      precoUnitario: respostasItens[item.id]?.precoUnitario || "0",
      descontoItem: respostasItens[item.id]?.descontoItem || "0"
    }));

    await submitFornecedorResposta(cotacaoId, {
      nomeFornecedor,
      prazoEntrega,
      condicaoPagamento,
      descontoGlobal,
      itens: payloadItens
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="glass-panel text-center animate-fade-in" style={{ padding: "4rem 2rem" }}>
        <h2 style={{ color: "var(--color-success)" }}>Proposta Enviada com Sucesso!</h2>
        <p className="mt-4">Sua cotação foi registrada. Agradecemos a participação, o comprador entrará em contato se for selecionado.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="glass-panel mb-8">
        <h2>Dados da sua Empresa</h2>
        <div className="grid-cols-2 mt-4">
          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label className="input-label">CNPJ (Autocompletar)</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input type="text" className="input-field" value={cnpj} onChange={e => setCnpj(e.target.value.replace(/[^0-9.-/]/g, ''))} placeholder="Apenas números" maxLength={18} />
                  <button type="button" className="btn btn--outline" onClick={buscarCnpj} disabled={isLoadingCnpj} style={{ whiteSpace: "nowrap" }}>
                    {isLoadingCnpj ? "Buscando..." : "Buscar"}
                  </button>
                </div>
              </div>
              <div style={{ flex: "2", minWidth: "300px" }}>
                <label className="input-label">Nome do Fornecedor (Nome Fantasia) *</label>
                <input required type="text" className="input-field" value={nomeFornecedor} onChange={e => setNomeFornecedor(e.target.value)} placeholder="Sua Empresa" />
              </div>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Prazo de Entrega</label>
            <input type="text" className="input-field" value={prazoEntrega} onChange={e => setPrazoEntrega(e.target.value)} placeholder="Ex: 5 dias úteis" />
          </div>
          <div className="input-group">
            <label className="input-label">Condição de Pagamento</label>
            <input type="text" className="input-field" value={condicaoPagamento} onChange={e => setCondicaoPagamento(e.target.value)} placeholder="Ex: 30/60 dias" />
          </div>
          <div className="input-group">
            <label className="input-label">Desconto Global no Total Final (R$)</label>
            <input type="number" step="0.01" className="input-field" value={descontoGlobal} onChange={e => setDescontoGlobal(e.target.value)} placeholder="0.00" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Caso haja desconto no fechamento do pacote completo.</span>
          </div>
        </div>
      </div>

      <div className="glass-panel mb-8">
        <h2>Itens Solicitados</h2>
        <p className="mb-4">Preencha os valores unitários para os itens que deseja cotar. Você pode deixar em branco itens que não trabalha.</p>
        
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto Solicitado</th>
                <th style={{ width: "20%" }}>Marca Ofertada<br/><span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "var(--text-secondary)" }}>(Se diferente da desejada)</span></th>
                <th style={{ width: "15%" }}>Preço Un. (R$)</th>
                <th style={{ width: "15%" }}>Desconto Item (R$)</th>
              </tr>
            </thead>
            <tbody>
              {itens.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.produto.nome}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      Qtd: {item.quantidade} {item.produto.unidade}
                      {item.marca && <span style={{ marginLeft: "0.5rem", color: "var(--color-brand-600)" }}>(Desejada: {item.marca})</span>}
                    </div>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder={item.marca ? `Ex: ${item.marca}` : "Sua marca"} 
                      value={respostasItens[item.id]?.marca || ""}
                      onChange={e => handleItemChange(item.id, "marca", e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="input-field" 
                      placeholder="0.00" 
                      value={respostasItens[item.id]?.precoUnitario || ""}
                      onChange={e => handleItemChange(item.id, "precoUnitario", e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="input-field" 
                      placeholder="0.00" 
                      value={respostasItens[item.id]?.descontoItem || ""}
                      onChange={e => handleItemChange(item.id, "descontoItem", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button type="submit" className="btn w-full" style={{ padding: "1rem", fontSize: "1.1rem" }}>
        Enviar Proposta
      </button>
    </form>
  );
}
