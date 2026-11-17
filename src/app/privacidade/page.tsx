import PaginaTexto from "@/components/PaginaTexto";
import { MARCA } from "@/lib/marca";

export const metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return (
    <PaginaTexto titulo="Política de privacidade" atualizado="16/11/2026">
      <p>
        Esta política explica como o {MARCA.nome} ({MARCA.empresa}) trata dados pessoais, conforme a Lei Geral de Proteção de Dados
        (Lei 13.709/2018 — LGPD).
      </p>
      <h2>1. Dados que coletamos</h2>
      <ul>
        <li><strong>De quem compra (cliente):</strong> nome, e-mail, telefone, nome da empresa, CPF/CNPJ e logomarca.</li>
        <li><strong>De fornecedores:</strong> nome da empresa, CNPJ, telefone, e-mail e os valores da proposta enviada.</li>
        <li><strong>Pagamentos:</strong> processados pelo Asaas. Não armazenamos dados de cartão.</li>
        <li><strong>Técnicos:</strong> registros de acesso necessários à segurança do serviço.</li>
      </ul>
      <h2>2. Para que usamos</h2>
      <ul>
        <li>Prestar o serviço: criar cotações, receber e comparar propostas.</li>
        <li>Enviar e-mails do sistema (códigos de acesso, aviso de nova proposta, recibos), por meio da Brevo.</li>
        <li>Cobrar a assinatura e cumprir obrigações legais e fiscais.</li>
      </ul>
      <h2>3. Compartilhamento</h2>
      <p>
        Os dados de uma cotação são visíveis apenas para a empresa que a criou. Os dados do fornecedor são compartilhados somente
        com a empresa que pediu a cotação. Usamos prestadores de serviço (hospedagem, banco de dados, e-mail e pagamento) que
        tratam os dados apenas em nosso nome. Não vendemos dados.
      </p>
      <h2>4. Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção, exportação ou exclusão dos seus dados pelo e-mail{" "}
        <a href={`mailto:${MARCA.emailSuporte}`}>{MARCA.emailSuporte}</a>. Excluiremos os dados ao fim da conta, salvo o que a lei
        exigir que seja guardado.
      </p>
      <h2>5. Segurança</h2>
      <p>
        Senhas são armazenadas com criptografia (hash), o acesso é feito por conexão segura (HTTPS) e cada empresa só acessa os
        próprios dados.
      </p>
    </PaginaTexto>
  );
}
