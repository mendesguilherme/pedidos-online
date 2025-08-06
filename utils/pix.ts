// utils/pix.ts

export function gerarPix(chave: string, nome: string, cidade: string, valor: number, mensagem?: string) {
  const format = (id: string, value: string) =>
    id + value.length.toString().padStart(2, "0") + value;

  const payload =
    format("00", "01") +
    format("26", format("00", "BR.GOV.BCB.PIX") + format("01", chave)) +
    format("52", "0000") +
    format("53", "986") +
    format("54", valor.toFixed(2)) +
    format("58", "BR") +
    format("59", nome) +
    format("60", cidade) +
    (mensagem ? format("62", format("05", mensagem)) : "");

  // CRC16
  const polinomio = 0x1021;
  let resultado = 0xffff;
  const bytes = (payload + "6304").split("").map((c) => c.charCodeAt(0));
  bytes.forEach((b) => {
    resultado ^= b << 8;
    for (let i = 0; i < 8; i++) {
      resultado = resultado & 0x8000 ? (resultado << 1) ^ polinomio : resultado << 1;
      resultado &= 0xffff;
    }
  });

  return payload + "6304" + resultado.toString(16).toUpperCase().padStart(4, "0");
}
