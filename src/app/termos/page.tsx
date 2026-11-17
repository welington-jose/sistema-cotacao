import PaginaTexto from "@/components/PaginaTexto";
import { DIAS_TESTE, DIAS_TOLERANCIA, MARCA } from "@/lib/marca";

export const metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <PaginaTexto titulo="Termos de uso" atualizado="16/11/2026">
      <p>
        Estes termos regulam o uso do {MARCA.nome}, serviço online de cotação de compras oferecido por {MARCA.empresa}. Ao criar
        uma conta, você declara que leu e concorda com estas condições.
      </p>
      <h2>1. O serviço</h2>
      <p>
        O {MARCA.nome} permite cadastrar produtos, criar cotações, enviar um link para fornecedores responderem e comparar as
        propostas recebidas. Os preços e condições são informados pelos próprios fornecedores; não participamos da negociação nem
        garantimos a entrega, a qualidade ou o preço dos produtos.
      </p>
      <h2>2. Conta e responsabilidades</h2>
      <ul>
        <li>Você é responsável pelas informações cadastradas e por manter sua senha em sigilo.</li>
        <li>É proibido usar o serviço para fins ilegais, enviar conteúdo ofensivo ou tentar acessar dados de outras empresas.</li>
        <li>Podemos suspender contas que violem estes termos.</li>
      </ul>
      <h2>3. Teste grátis, planos e pagamento</h2>
      <ul>
        <li>Toda conta nova tem {DIAS_TESTE} dias de teste grátis, sem necessidade de cartão.</li>
        <li>Após o teste, o uso exige um plano pago (mensal ou anual), cobrado por meio do Asaas (PIX, boleto ou cartão).</li>
        <li>
          Se o pagamento não for identificado, o acesso continua por {DIAS_TOLERANCIA} dias após o vencimento e depois é
          suspenso até a regularização. Seus dados não são apagados por atraso.
        </li>
        <li>Você pode cancelar a renovação a qualquer momento; o acesso segue até o fim do período já pago. Não há reembolso proporcional.</li>
        <li>Os preços podem ser reajustados com aviso prévio de 30 dias por e-mail.</li>
      </ul>
      <h2>4. Disponibilidade</h2>
      <p>
        Trabalhamos para manter o serviço disponível, mas podem ocorrer interrupções para manutenção ou por falhas de terceiros. Não
        nos responsabilizamos por perdas decorrentes de indisponibilidade temporária.
      </p>
      <h2>5. Dados</h2>
      <p>
        Os dados cadastrados pertencem à sua empresa. O tratamento de dados pessoais segue a nossa{" "}
        <a href="/privacidade">Política de Privacidade</a>.
      </p>
      <h2>6. Contato</h2>
      <p>
        Dúvidas sobre estes termos: <a href={`mailto:${MARCA.emailSuporte}`}>{MARCA.emailSuporte}</a>.
      </p>
    </PaginaTexto>
  );
}
