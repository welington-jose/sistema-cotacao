// Integração com o Asaas (cobrança recorrente: PIX, boleto e cartão).
// Variáveis: ASAAS_API_KEY, ASAAS_AMBIENTE ("producao" ou "sandbox", padrão sandbox), ASAAS_WEBHOOK_TOKEN.
// A chave fica só no servidor; o navegador do cliente nunca fala direto com o Asaas.

function baseUrl() {
  return process.env.ASAAS_AMBIENTE === "producao" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
}

export function asaasConfigurado() {
  return Boolean(process.env.ASAAS_API_KEY);
}

async function chamar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const resposta = await fetch(`${baseUrl()}${caminho}`, {
    method: metodo,
    headers: {
      access_token: process.env.ASAAS_API_KEY || "",
      "Content-Type": "application/json",
      "User-Agent": "cotacoes-inteligentes",
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: "no-store",
  });

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = (dados as { errors?: { description?: string }[] }).errors?.[0]?.description;
    console.error("Asaas", metodo, caminho, resposta.status, JSON.stringify(dados));
    throw new Error(erro || "Não foi possível falar com o sistema de pagamento. Tente novamente.");
  }
  return dados as T;
}

export async function criarCliente(dados: { nome: string; documento: string; email: string; telefone?: string | null; userId: string }) {
  const cliente = await chamar<{ id: string }>("POST", "/customers", {
    name: dados.nome,
    cpfCnpj: dados.documento,
    email: dados.email,
    mobilePhone: dados.telefone || undefined,
    externalReference: dados.userId,
    notificationDisabled: false,
  });
  return cliente.id;
}

export async function criarAssinatura(dados: {
  clienteId: string;
  valor: number;
  ciclo: "MONTHLY" | "YEARLY";
  primeiroVencimento: Date;
  descricao: string;
  userId: string;
}) {
  const venc = dados.primeiroVencimento.toISOString().slice(0, 10);
  const assinatura = await chamar<{ id: string }>("POST", "/subscriptions", {
    customer: dados.clienteId,
    billingType: "UNDEFINED", // o cliente escolhe PIX, boleto ou cartão na página do Asaas
    value: dados.valor,
    nextDueDate: venc,
    cycle: dados.ciclo,
    description: dados.descricao,
    externalReference: dados.userId,
  });
  return assinatura.id;
}

export async function linkPrimeiraCobranca(assinaturaId: string) {
  const lista = await chamar<{ data: { id: string; invoiceUrl: string; status: string }[] }>(
    "GET",
    `/subscriptions/${assinaturaId}/payments`,
  );
  const pendente = lista.data.find((p) => p.status === "PENDING" || p.status === "OVERDUE") ?? lista.data[0];
  return pendente?.invoiceUrl ?? null;
}

export async function cancelarAssinatura(assinaturaId: string) {
  await chamar("DELETE", `/subscriptions/${assinaturaId}`);
}
