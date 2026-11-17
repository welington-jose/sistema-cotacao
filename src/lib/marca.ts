// Identidade e regras comerciais do produto. Valores de preço podem ser trocados por variáveis de ambiente
// sem mexer no código (PRECO_MENSAL, PRECO_ANUAL, DIAS_TESTE).

export const MARCA = {
  nome: "Cotações Inteligentes",
  nomeCurto: "Cotações",
  slogan: "Compare propostas de fornecedores em minutos, não em dias.",
  empresa: "Four Sistemas",
  emailSuporte: process.env.EMAIL_SUPORTE || "contato@foursistemas.com",
  whatsappSuporte: process.env.WHATSAPP_SUPORTE || "",
};

function numeroEnv(nome: string, padrao: number) {
  const valor = Number(process.env[nome]);
  return Number.isFinite(valor) && valor > 0 ? valor : padrao;
}

export const DIAS_TESTE = numeroEnv("DIAS_TESTE", 7);
export const DIAS_TOLERANCIA = 3;

export const PLANOS = {
  MENSAL: {
    id: "MENSAL" as const,
    nome: "Mensal",
    valor: numeroEnv("PRECO_MENSAL", 49.9),
    ciclo: "MONTHLY" as const,
    meses: 1,
    descricao: "Cobrança todo mês. Cancele quando quiser.",
  },
  ANUAL: {
    id: "ANUAL" as const,
    nome: "Anual",
    valor: numeroEnv("PRECO_ANUAL", 478.8),
    ciclo: "YEARLY" as const,
    meses: 12,
    descricao: "Pagamento único por ano, com desconto.",
  },
};

export type PlanoId = keyof typeof PLANOS;

export function urlBase() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}
