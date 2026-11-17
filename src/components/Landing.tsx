import Link from "next/link";
import Icone, { type NomeIcone } from "./Icone";
import { SiteFooter, SiteHeader } from "./Site";
import { DIAS_TESTE, PLANOS } from "@/lib/marca";
import { formatMoeda } from "@/lib/format";

const recursos: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "link", titulo: "Um link para todos", texto: "Crie a cotação uma vez e envie o mesmo link para quantos fornecedores quiser, por WhatsApp ou e-mail." },
  { icone: "celular", titulo: "Fornecedor responde pelo celular", texto: "Sem cadastro e sem aplicativo. Ele abre o link, digita os preços e envia. Leva poucos minutos." },
  { icone: "trofeu", titulo: "Menor preço destacado", texto: "O sistema compara tudo sozinho: menor preço de cada item, total por fornecedor e a melhor combinação." },
  { icone: "porco", titulo: "Economia visível", texto: "Veja quanto você economiza comprando cada item de quem cobra menos, em vez de fechar tudo com um só." },
  { icone: "baixar", titulo: "PDF pronto para aprovar", texto: "Baixe o comparativo em PDF com a sua logomarca para mostrar ao sócio, ao financeiro ou arquivar." },
  { icone: "escudo", titulo: "Seus dados separados", texto: "Cada empresa vê só os próprios produtos, cotações e propostas. Acesso com Google ou e-mail e senha." },
];

const perguntas = [
  ["O fornecedor precisa criar conta?", "Não. Ele recebe o link, preenche os preços no navegador do celular ou computador e envia. Você recebe um e-mail a cada proposta."],
  ["Posso cotar com quantos fornecedores?", "Quantos quiser. Não há limite de fornecedores, de cotações ou de produtos no catálogo."],
  ["Como funciona o teste grátis?", `Você usa o sistema completo por ${DIAS_TESTE} dias, sem informar cartão. Se gostar, assina pelo próprio sistema e não perde os dias de teste que sobraram.`],
  ["Quais formas de pagamento?", "PIX, boleto ou cartão de crédito. O plano mensal renova sozinho e pode ser cancelado quando quiser, sem multa."],
  ["Serve para o meu tipo de empresa?", "Serve para qualquer empresa que compra de vários fornecedores: restaurantes, mercados, construtoras, oficinas, clínicas, indústrias, transportadoras, condomínios e órgãos que precisam de três orçamentos."],
  ["Posso usar a minha logomarca?", "Sim. A sua logo aparece na página que o fornecedor abre e no PDF do comparativo."],
];

function MockComparativo() {
  const linhas = [
    { item: "Cimento CP-II 50kg", qtd: "120 sc", a: "R$ 38,90", b: "R$ 36,50", c: "R$ 37,20", melhor: "b" },
    { item: "Areia média", qtd: "18 m³", a: "R$ 142,00", b: "R$ 155,00", c: "R$ 139,00", melhor: "c" },
    { item: "Vergalhão 10mm", qtd: "80 br", a: "R$ 46,80", b: "R$ 49,90", c: "—", melhor: "a" },
    { item: "Tijolo 8 furos", qtd: "6.000 un", a: "R$ 0,92", b: "R$ 0,88", c: "R$ 0,95", melhor: "b" },
  ];
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock__bar">
        <span />
        <span />
        <span />
      </div>
      <div className="mock__body">
        <div className="flex-between mb-4">
          <div>
            <div className="text-xs text-muted fw-700">COTAÇÃO Nº 000128</div>
            <div className="fw-700">Materiais — Obra Residencial Jardins</div>
          </div>
          <span className="badge badge--success badge--dot">3 propostas</span>
        </div>
        <div className="grid-3 mb-4" style={{ gap: "0.6rem" }}>
          <div className="stat" style={{ padding: "0.7rem" }}>
            <div className="stat__label">Melhor combinação</div>
            <div className="stat__value" style={{ fontSize: "1.1rem" }}>R$ 15.462</div>
          </div>
          <div className="stat stat--success" style={{ padding: "0.7rem" }}>
            <div className="stat__label">Economia</div>
            <div className="stat__value" style={{ fontSize: "1.1rem" }}>R$ 1.318</div>
          </div>
          <div className="stat" style={{ padding: "0.7rem" }}>
            <div className="stat__label">Itens cotados</div>
            <div className="stat__value" style={{ fontSize: "1.1rem" }}>4 de 4</div>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="data-table matrix" style={{ fontSize: "0.8rem" }}>
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Casa Forte</th>
                <th className="num">Constrular</th>
                <th className="num">Depósito Sol</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.item}>
                  <td>
                    <div className="fw-600" style={{ color: "var(--text)" }}>{l.item}</div>
                    <div className="text-xs text-muted">{l.qtd}</div>
                  </td>
                  {(["a", "b", "c"] as const).map((k) => (
                    <td key={k} className={`num ${l.melhor === k ? "cell-best price-best" : ""}`}>
                      {l[k]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const mensal = PLANOS.MENSAL;
  const anual = PLANOS.ANUAL;
  const anualPorMes = anual.valor / 12;
  const descontoAnual = Math.round((1 - anual.valor / (mensal.valor * 12)) * 100);

  return (
    <>
      <SiteHeader />

      <section className="hero">
        <div className="hero__inner">
          <div>
            <span className="hero__badge">
              <b>Novo</b> Comparativo automático com PDF
            </span>
            <h1>
              Cote com vários fornecedores e <em>pague menos</em> em cada compra.
            </h1>
            <p className="hero__lead">
              Envie um link, receba as propostas e veja na hora o menor preço de cada item. Sem planilha, sem ficar
              copiando valores do WhatsApp.
            </p>
            <div className="hero__actions">
              <Link href="/cadastro" className="btn btn--lg">
                Testar grátis por {DIAS_TESTE} dias <Icone nome="seta" />
              </Link>
              <a href="#como-funciona" className="btn btn--lg btn--outline">
                Ver como funciona
              </a>
            </div>
            <div className="hero__note">
              <span>
                <Icone nome="check" tamanho={16} /> Sem cartão para testar
              </span>
              <span>
                <Icone nome="check" tamanho={16} /> Fornecedor não precisa de conta
              </span>
              <span>
                <Icone nome="check" tamanho={16} /> Cancele quando quiser
              </span>
            </div>
          </div>
          <MockComparativo />
        </div>
      </section>

      <section className="section section--muted" id="como-funciona">
        <div className="section__inner">
          <div className="section__head section__head--center">
            <div className="section__eyebrow">Como funciona</div>
            <h2 className="section__title">Da lista de compras ao melhor preço em três passos</h2>
          </div>
          <div className="grid-3">
            <div className="how-step">
              <span className="how-step__n">1</span>
              <h3>Monte a cotação</h3>
              <p>Escolha os produtos do seu catálogo, informe as quantidades e, se quiser, a marca preferida e o prazo para resposta.</p>
            </div>
            <div className="how-step">
              <span className="how-step__n">2</span>
              <h3>Envie para os fornecedores</h3>
              <p>Um clique para mandar pelo WhatsApp ou por e-mail. Cada fornecedor preenche preço, marca, estoque, prazo e pagamento.</p>
            </div>
            <div className="how-step">
              <span className="how-step__n">3</span>
              <h3>Compare e decida</h3>
              <p>O comparativo fica pronto sozinho, com o vencedor de cada item, o total de cada fornecedor e a economia. Baixe em PDF.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="recursos">
        <div className="section__inner">
          <div className="section__head">
            <div className="section__eyebrow">Recursos</div>
            <h2 className="section__title">Tudo o que o setor de compras precisa, sem complicação</h2>
            <p className="section__lead">Feito para quem compra de verdade: rápido de usar, fácil para o fornecedor e com números que você confia.</p>
          </div>
          <div className="grid-3">
            {recursos.map((r) => (
              <div key={r.titulo} className="feature">
                <div className="feature__icon">
                  <Icone nome={r.icone} tamanho={22} />
                </div>
                <h3>{r.titulo}</h3>
                <p>{r.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--muted" id="precos">
        <div className="section__inner">
          <div className="section__head section__head--center">
            <div className="section__eyebrow">Preços</div>
            <h2 className="section__title">Um preço simples, sem limite de uso</h2>
            <p className="section__lead">Cotações, fornecedores e produtos ilimitados em qualquer plano. Comece com {DIAS_TESTE} dias grátis.</p>
          </div>
          <div className="grid-2" style={{ maxWidth: 820, margin: "0 auto" }}>
            <div className="price-card">
              <div className="price-card__name">Plano {mensal.nome}</div>
              <div className="price-card__price">
                {formatMoeda(mensal.valor)} <small>/mês</small>
              </div>
              <div className="price-card__desc">{mensal.descricao}</div>
              <ul>
                <li><Icone nome="check" tamanho={16} /> Cotações e fornecedores ilimitados</li>
                <li><Icone nome="check" tamanho={16} /> Comparativo e PDF com sua logo</li>
                <li><Icone nome="check" tamanho={16} /> Aviso por e-mail a cada proposta</li>
                <li><Icone nome="check" tamanho={16} /> PIX, boleto ou cartão</li>
              </ul>
              <Link href="/cadastro" className="btn btn--outline btn--lg btn--block">
                Começar teste grátis
              </Link>
            </div>
            <div className="price-card price-card--featured">
              <span className="price-card__tag">Economize {descontoAnual}%</span>
              <div className="price-card__name">Plano {anual.nome}</div>
              <div className="price-card__price">
                {formatMoeda(anualPorMes)} <small>/mês</small>
              </div>
              <div className="price-card__desc">
                {formatMoeda(anual.valor)} por ano. {anual.descricao}
              </div>
              <ul>
                <li><Icone nome="check" tamanho={16} /> Tudo do plano mensal</li>
                <li><Icone nome="check" tamanho={16} /> {descontoAnual}% de desconto</li>
                <li><Icone nome="check" tamanho={16} /> Pague uma vez e esqueça por 12 meses</li>
                <li><Icone nome="check" tamanho={16} /> Preço garantido por 12 meses</li>
              </ul>
              <Link href="/cadastro" className="btn btn--lg btn--block">
                Começar teste grátis
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="perguntas">
        <div className="section__inner">
          <div className="section__head section__head--center">
            <div className="section__eyebrow">Dúvidas</div>
            <h2 className="section__title">Perguntas frequentes</h2>
          </div>
          <div className="faq">
            {perguntas.map(([p, r]) => (
              <details key={p}>
                <summary>{p}</summary>
                <p>{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="cta-band">
          <div>
            <h2>Sua próxima compra pode sair mais barata.</h2>
            <p>Crie a conta em menos de um minuto e envie a primeira cotação hoje.</p>
          </div>
          <Link href="/cadastro" className="btn btn--lg">
            Testar grátis <Icone nome="seta" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
