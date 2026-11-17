# Memória do projeto — Cotações Inteligentes

Documento vivo: atualizar a cada entrega. Serve para qualquer pessoa (ou sessão do Claude Code) continuar o trabalho.

## O que é
SaaS de cotação de compras. O comprador cadastra produtos, cria uma cotação e envia um link (WhatsApp/e-mail).
O fornecedor responde sem criar conta. O sistema compara: menor preço por item, total por fornecedor, melhor
combinação, economia e pedido sugerido por fornecedor. PDF do comparativo com a logo do cliente.

## Regras comerciais (configuráveis por variável de ambiente)
- Teste grátis de 7 dias (`DIAS_TESTE`), sem cartão.
- Mensal R$ 49,90 (`PRECO_MENSAL`) · Anual R$ 478,80 (`PRECO_ANUAL`, 20% off). Ilimitado em tudo.
- Cobrança pelo Asaas: o cliente escolhe PIX, boleto ou cartão na página do Asaas.
- Quem assina durante o teste não perde os dias restantes. 3 dias de tolerância após o vencimento; depois bloqueia
  (os dados nunca são apagados). Regras em `src/lib/acesso.ts` e `src/lib/assinatura.ts`.

## Onde está cada coisa
| Caminho | O quê |
|---|---|
| `src/lib/analise.ts` | Cálculo do comparativo (tela e PDF usam o mesmo) |
| `src/lib/pdf/ComparativoPdf.tsx` + `src/app/api/cotacoes/[id]/pdf` | PDF A4 paisagem |
| `src/lib/email.ts` | E-mails pela Brevo (código, nova proposta, convite, recibo) |
| `src/lib/asaas.ts`, `src/app/actions/assinatura.ts`, `src/app/api/asaas/webhook` | Assinatura |
| `src/lib/acesso.ts` | Login + teste/assinatura (`exigirAcesso()` em toda página interna) |
| `src/app/share/[id]` | Portal do fornecedor (público) |
| `src/components/Landing.tsx` | Site de vendas (página `/` para quem não está logado) |
| `src/app/globals.css` | Sistema de design (cores, botões, cartões, tabelas) |

## Segurança
- Toda página/ação interna confere que a cotação é do usuário logado (antes qualquer um abria a de outro).
- Código por e-mail: 5 tentativas, 15 min de validade, 1 envio por minuto.
- Proposta do fornecedor só entra em cotação aberta e dentro do prazo; valores validados no servidor.

## Rodar no Mac (testes)
- Banco local (não mexe na Neon): `node ~/.cotacao-dev-db/start.js` (Postgres na porta 54329).
- `.env.local` aponta `DATABASE_URL` para ele. Atualizar tabelas: `DATABASE_URL=postgresql://dev:dev@localhost:54329/cotacao npx prisma db push`.
- `npm run dev` → http://localhost:3000. Sem Brevo, os códigos de e-mail aparecem no terminal; sem Asaas, a tela de
  plano tem “Simular pagamento”.
- Teste de ponta a ponta com Chrome: `node ~/.cotacao-dev-db/e2e.mjs PASTA_DAS_FOTOS`.

## Colocar no ar (pendente — precisa do dono)
1. **Banco de produção:** `npx prisma db push` com o `DATABASE_URL` da Neon. Só acrescenta colunas/tabela nova
   (nada é apagado). Fazer backup/branch na Neon antes, por segurança.
2. **Variáveis na hospedagem:** ver `.env.example` (Brevo, Asaas, NEXTAUTH_URL do domínio final).
3. **Brevo:** criar conta, validar o domínio/remetente, gerar chave da API (`BREVO_API_KEY`).
4. **Asaas:** pode usar a mesma conta do Arquiva Cloud. Gerar chave, cadastrar o webhook
   `https://DOMINIO/api/asaas/webhook` com o token `ASAAS_WEBHOOK_TOKEN`, eventos de cobrança e assinatura.
   Testar no sandbox antes de `ASAAS_AMBIENTE=producao`.
5. **Google login:** acrescentar o domínio final nas URLs autorizadas do OAuth.
6. Termos de uso e privacidade são um modelo: revisar com advogado.

## Ideias futuras
- Aviso por e-mail quando o teste estiver acabando (precisa de tarefa agendada).
- Vários usuários por empresa; histórico de preços por produto; exportar Excel.

## Linha do tempo
- 16/11/2026 — Ramo `profissional`: redesign completo, site de vendas, PDF real, Brevo, Asaas, correções de
  segurança, catálogo com edição/importação, convites por e-mail/WhatsApp, pedido sugerido por fornecedor.
