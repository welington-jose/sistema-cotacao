export function formatCotacaoNumero(numero: number) {
  return numero.toString().padStart(6, "0");
}

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

export function formatMoeda(valor: number | null | undefined) {
  return moeda.format(valor ?? 0);
}

export function formatNumero(valor: number | null | undefined) {
  return numero.format(valor ?? 0);
}

export function formatData(data: Date | string | null | undefined) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function formatDataHora(data: Date | string | null | undefined) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Aceita "1.234,56", "1234,56", "1234.56" e devolve número (ou null se vazio/inválido). */
export function parseValor(texto: string | number | null | undefined): number | null {
  if (texto === null || texto === undefined) return null;
  if (typeof texto === "number") return Number.isFinite(texto) ? texto : null;
  let s = texto.trim().replace(/[R$\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  // "6.000" ou "1.250.000" (sem vírgula) = separador de milhar, como se escreve no Brasil.
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** true se a data já passou. */
export function jaPassou(data: Date | null | undefined) {
  return Boolean(data && data.getTime() < Date.now());
}

export function apenasDigitos(texto: string | null | undefined) {
  return (texto || "").replace(/\D/g, "");
}

export function formatDocumento(texto: string | null | undefined) {
  const d = apenasDigitos(texto);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return texto || "";
}

export function formatTelefone(texto: string | null | undefined) {
  const d = apenasDigitos(texto);
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return texto || "";
}

/** Link de WhatsApp para um telefone brasileiro (acrescenta 55 se faltar). */
export function linkWhatsapp(telefone: string | null | undefined, texto?: string) {
  let d = apenasDigitos(telefone);
  if (!d) return null;
  if (d.length <= 11) d = "55" + d;
  return `https://wa.me/${d}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

function digitoVerificador(base: string, pesos: number[]) {
  const soma = base.split("").reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cpfValido(texto: string) {
  const d = apenasDigitos(texto);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const d1 = digitoVerificador(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[9]) && d2 === Number(d[10]);
}

export function cnpjValido(texto: string) {
  const d = apenasDigitos(texto);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const d1 = digitoVerificador(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

export function documentoValido(texto: string) {
  const d = apenasDigitos(texto);
  return d.length === 11 ? cpfValido(d) : cnpjValido(d);
}
