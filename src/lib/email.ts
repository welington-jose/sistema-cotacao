import { MARCA, urlBase } from "./marca";

// Envio de e-mails transacionais pela Brevo (https://www.brevo.com).
// Variáveis: BREVO_API_KEY, EMAIL_REMETENTE (precisa estar validado na Brevo) e EMAIL_REMETENTE_NOME.
// Sem BREVO_API_KEY (desenvolvimento), o e-mail não é enviado: o conteúdo aparece no terminal.

type Email = {
  para: string;
  paraNome?: string;
  assunto: string;
  html: string;
  responderPara?: { email: string; nome?: string };
};

export async function enviarEmail({ para, paraNome, assunto, html, responderPara }: Email) {
  const chave = process.env.BREVO_API_KEY;

  if (!chave) {
    const texto = html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    console.log(`\n[E-MAIL NÃO ENVIADO — sem BREVO_API_KEY]\nPara: ${para}\nAssunto: ${assunto}\n${texto}\n`);
    return { enviado: false, modoDesenvolvimento: true };
  }

  const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": chave, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: {
        email: process.env.EMAIL_REMETENTE || MARCA.emailSuporte,
        name: process.env.EMAIL_REMETENTE_NOME || MARCA.nome,
      },
      to: [{ email: para, ...(paraNome ? { name: paraNome } : {}) }],
      ...(responderPara ? { replyTo: { email: responderPara.email, ...(responderPara.nome ? { name: responderPara.nome } : {}) } } : {}),
      subject: assunto,
      htmlContent: html,
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    console.error("Brevo recusou o e-mail:", resposta.status, detalhe);
    throw new Error("Não foi possível enviar o e-mail agora. Tente novamente em instantes.");
  }

  return { enviado: true, modoDesenvolvimento: false };
}

function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Moldura padrão de todos os e-mails (tabelas e estilos inline, para funcionar no Gmail/Outlook). */
function moldura(titulo: string, corpo: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="background:#0f766e;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:700">${escapar(MARCA.nome)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a">${escapar(titulo)}</h1>
${corpo}
</td></tr>
<tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b">
${escapar(MARCA.nome)} · ${escapar(MARCA.empresa)}<br>Você recebeu este e-mail por causa de uma ação no sistema. Se não foi você, ignore.
</td></tr>
</table></td></tr></table></body></html>`;
}

function paragrafo(texto: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155">${texto}</p>`;
}

function botao(texto: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px"><tr><td style="background:#0f766e;border-radius:10px">
<a href="${url}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none">${escapar(texto)}</a>
</td></tr></table>`;
}

function codigoGrande(codigo: string) {
  return `<div style="margin:6px 0 18px;padding:18px;background:#f0fdfa;border:1px dashed #5eead4;border-radius:12px;text-align:center;font-size:32px;letter-spacing:10px;font-weight:700;color:#0f766e">${escapar(codigo)}</div>`;
}

export function emailCodigo(tipo: "REGISTER" | "RESET_PASSWORD", codigo: string) {
  const cadastro = tipo === "REGISTER";
  return {
    assunto: cadastro ? `${codigo} é o seu código de cadastro` : `${codigo} é o seu código para trocar a senha`,
    html: moldura(
      cadastro ? "Confirme seu e-mail" : "Trocar a senha",
      paragrafo(cadastro ? "Use o código abaixo para concluir o seu cadastro:" : "Use o código abaixo para criar uma nova senha:") +
        codigoGrande(codigo) +
        paragrafo("O código vale por 15 minutos. Não compartilhe com ninguém."),
    ),
  };
}

export function emailNovaProposta(dados: {
  nomeComprador: string;
  numero: string;
  titulo: string;
  fornecedor: string;
  total: string;
  totalRespostas: number;
  cotacaoId: string;
}) {
  return {
    assunto: `Nova proposta de ${dados.fornecedor} — Cotação Nº ${dados.numero}`,
    html: moldura(
      "Você recebeu uma nova proposta",
      paragrafo(`Olá, ${escapar(dados.nomeComprador)}.`) +
        paragrafo(
          `<strong>${escapar(dados.fornecedor)}</strong> respondeu a cotação <strong>Nº ${escapar(dados.numero)} — ${escapar(dados.titulo)}</strong> com o total de <strong>${escapar(dados.total)}</strong>.`,
        ) +
        paragrafo(`Agora são <strong>${dados.totalRespostas}</strong> proposta(s) para comparar.`) +
        botao("Ver comparativo", `${urlBase()}/dashboard/${dados.cotacaoId}`),
    ),
  };
}

export function emailConviteFornecedor(dados: {
  empresa: string;
  numero: string;
  titulo: string;
  itens: number;
  prazo?: string | null;
  mensagem?: string | null;
  link: string;
}) {
  return {
    assunto: `${dados.empresa} solicita sua cotação — Nº ${dados.numero}`,
    html: moldura(
      "Pedido de cotação",
      paragrafo(`<strong>${escapar(dados.empresa)}</strong> convida você a enviar uma proposta para a cotação <strong>Nº ${escapar(dados.numero)} — ${escapar(dados.titulo)}</strong> (${dados.itens} item(ns)).`) +
        (dados.prazo ? paragrafo(`Prazo para resposta: <strong>${escapar(dados.prazo)}</strong>.`) : "") +
        (dados.mensagem ? paragrafo(`<em>“${escapar(dados.mensagem)}”</em>`) : "") +
        paragrafo("Não é preciso criar conta: abra o link, preencha os preços e envie.") +
        botao("Responder cotação", dados.link),
    ),
  };
}

export function emailPagamentoConfirmado(dados: { nome: string; plano: string; valor: string; validoAte: string }) {
  return {
    assunto: `Pagamento confirmado — ${MARCA.nome}`,
    html: moldura(
      "Pagamento confirmado. Obrigado!",
      paragrafo(`Olá, ${escapar(dados.nome)}. Recebemos o pagamento do plano <strong>${escapar(dados.plano)}</strong> no valor de <strong>${escapar(dados.valor)}</strong>.`) +
        paragrafo(`Seu acesso está garantido até <strong>${escapar(dados.validoAte)}</strong>.`) +
        botao("Abrir o sistema", urlBase()),
    ),
  };
}
