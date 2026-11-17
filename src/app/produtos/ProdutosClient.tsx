"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { atualizarProduto, createProduto, deleteProduto, importarProdutos } from "../actions/produtos";
import { UNIDADES } from "@/lib/unidades";
import Icone from "@/components/Icone";

type Produto = { id: string; nome: string; unidade: string; descricao: string | null; usos: number };

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function SeletorUnidade({ valor, onChange, id }: { valor: string; onChange: (v: string) => void; id?: string }) {
  const conhecida = UNIDADES.some((u) => u.valor === valor);
  return (
    <select id={id} className="input-field" value={valor} onChange={(e) => onChange(e.target.value)}>
      {!conhecida && <option value={valor}>{valor}</option>}
      {UNIDADES.map((u) => (
        <option key={u.valor} value={u.valor}>{u.rotulo}</option>
      ))}
    </select>
  );
}

function LinhaProduto({ produto }: { produto: Produto }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(produto.nome);
  const [unidade, setUnidade] = useState(produto.unidade);
  const [descricao, setDescricao] = useState(produto.descricao || "");
  const [erro, setErro] = useState("");
  const [pendente, start] = useTransition();

  function salvar() {
    setErro("");
    start(async () => {
      const r = await atualizarProduto(produto.id, { nome, unidade, descricao });
      if (r.ok) setEditando(false);
      else setErro(r.erro);
    });
  }

  function excluir() {
    if (!confirm(`Excluir “${produto.nome}” do catálogo?`)) return;
    start(async () => {
      const r = await deleteProduto(produto.id);
      if (!r.ok) alert(r.erro);
    });
  }

  if (editando) {
    return (
      <tr>
        <td colSpan={4}>
          <div className="form-row" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}>
            <div className="field">
              <label className="input-label">Nome</label>
              <input className="input-field" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={150} autoFocus />
            </div>
            <div className="field">
              <label className="input-label">Unidade</label>
              <SeletorUnidade valor={unidade} onChange={setUnidade} />
            </div>
          </div>
          <div className="field">
            <label className="input-label">Descrição</label>
            <input className="input-field" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={500} placeholder="Especificação, medida, referência..." />
          </div>
          {erro && <div className="input-error mb-2">{erro}</div>}
          <div className="row">
            <button type="button" className="btn btn--sm" onClick={salvar} disabled={pendente}>
              {pendente ? <span className="spinner" /> : <Icone nome="check" tamanho={15} />} Salvar
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ opacity: pendente ? 0.5 : 1 }}>
      <td>
        <div className="fw-600" style={{ color: "var(--text)" }}>{produto.nome}</div>
        {produto.descricao && <div className="text-xs text-muted">{produto.descricao}</div>}
      </td>
      <td>
        <span className="badge">{produto.unidade}</span>
      </td>
      <td className="muted text-sm">{produto.usos > 0 ? `${produto.usos} cotação(ões)` : "—"}</td>
      <td className="num">
        <div className="row" style={{ justifyContent: "flex-end", gap: "0.25rem" }}>
          <button type="button" className="btn btn--ghost btn--icon" title="Editar" aria-label={`Editar ${produto.nome}`} onClick={() => setEditando(true)}>
            <Icone nome="editar" tamanho={16} />
          </button>
          <button type="button" className="btn btn--ghost btn--icon" title="Excluir" aria-label={`Excluir ${produto.nome}`} onClick={excluir} disabled={pendente}>
            <Icone nome="lixo" tamanho={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ProdutosClient({ produtos }: { produtos: Produto[] }) {
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<"um" | "varios">("um");
  const [unidade, setUnidade] = useState("un");
  const [lista, setLista] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendente, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const filtrados = useMemo(() => {
    const t = normalizar(busca.trim());
    return t ? produtos.filter((p) => normalizar(p.nome).includes(t) || normalizar(p.descricao || "").includes(t)) : produtos;
  }, [produtos, busca]);

  function cadastrar(dados: FormData) {
    setMsg(null);
    start(async () => {
      try {
        await createProduto(dados);
        formRef.current?.reset();
        setUnidade("un");
        setMsg({ ok: true, texto: "Produto cadastrado." });
        formRef.current?.querySelector<HTMLInputElement>("#nome")?.focus();
      } catch (e) {
        setMsg({ ok: false, texto: e instanceof Error ? e.message : "Não foi possível cadastrar." });
      }
    });
  }

  function importar() {
    setMsg(null);
    start(async () => {
      const r = await importarProdutos(lista);
      if (r.ok) {
        setLista("");
        setMsg({ ok: true, texto: r.mensagem || "Produtos cadastrados." });
      } else setMsg({ ok: false, texto: r.erro });
    });
  }

  return (
    <div className="grid-aside-main">
      <div className="card sticky-top">
        <div className="card__header">
          <div className="card__title">
            <Icone nome="mais" /> Cadastrar
          </div>
          <div className="tabs">
            <button type="button" className={modo === "um" ? "active" : ""} onClick={() => setModo("um")}>
              Um
            </button>
            <button type="button" className={modo === "varios" ? "active" : ""} onClick={() => setModo("varios")}>
              Vários
            </button>
          </div>
        </div>

        {modo === "um" ? (
          <form ref={formRef} action={cadastrar}>
            <div className="field">
              <label htmlFor="nome" className="input-label">Nome do produto *</label>
              <input type="text" id="nome" name="nome" required maxLength={150} className="input-field" placeholder="Ex.: Cimento CP-II 50kg" />
            </div>
            <div className="field">
              <label htmlFor="unidade" className="input-label">Unidade</label>
              <SeletorUnidade id="unidade" valor={unidade} onChange={setUnidade} />
              <input type="hidden" name="unidade" value={unidade} />
            </div>
            <div className="field">
              <label htmlFor="descricao" className="input-label">
                Descrição <span className="opcional">(opcional)</span>
              </label>
              <textarea id="descricao" name="descricao" rows={2} maxLength={500} className="input-field" placeholder="Especificação, medida, referência..." />
            </div>
            <button type="submit" className="btn btn--block" disabled={pendente}>
              {pendente ? <span className="spinner" /> : <Icone nome="mais" />} Cadastrar produto
            </button>
          </form>
        ) : (
          <div>
            <div className="field">
              <label htmlFor="lista" className="input-label">Um produto por linha</label>
              <textarea
                id="lista"
                className="input-field"
                rows={8}
                value={lista}
                onChange={(e) => setLista(e.target.value)}
                placeholder={"Arroz tipo 1 5kg; pct\nFeijão carioca 1kg; pct\nÓleo de soja 900ml; un\nDiesel S10; l"}
              />
              <span className="input-hint">
                Pode colar de uma planilha. Para informar a unidade, use ponto e vírgula: <code>Nome; kg</code>. Sem unidade, fica “un”.
              </span>
            </div>
            <button type="button" className="btn btn--block" onClick={importar} disabled={pendente || !lista.trim()}>
              {pendente ? <span className="spinner" /> : <Icone nome="mais" />} Cadastrar todos
            </button>
          </div>
        )}

        {msg && (
          <div className={`alert mt-4 ${msg.ok ? "alert--success" : "alert--error"}`}>
            <Icone nome={msg.ok ? "checkCirculo" : "alerta"} /> <div>{msg.texto}</div>
          </div>
        )}
      </div>

      <div className="card card--flush">
        <div className="card__header card__header--bordered" style={{ flexWrap: "wrap" }}>
          <div className="card__title">
            Produtos <span className="badge">{produtos.length}</span>
          </div>
          <div className="input-search" style={{ minWidth: 240, flex: "0 1 320px" }}>
            <Icone nome="busca" tamanho={16} />
            <input className="input-field input-field--sm" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar produto" />
          </div>
        </div>

        {produtos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icone nome="caixa" tamanho={26} />
            </div>
            <h3>Catálogo vazio</h3>
            <p>Cadastre os produtos que você costuma comprar. Dica: use “Vários” para colar uma lista inteira de uma vez.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Unidade</th>
                  <th>Usado em</th>
                  <th className="num">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <LinhaProduto key={`${p.id}-${p.nome}-${p.unidade}-${p.descricao}`} produto={p} />
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="center muted">
                      Nenhum produto encontrado para “{busca}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
