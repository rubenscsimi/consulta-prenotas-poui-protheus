export const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function baixarArquivo(nome: string, conteudoBase64: string, tipo: string): void {
  const bytes = Uint8Array.from(atob(conteudoBase64), (caractere) => caractere.charCodeAt(0));
  const endereco = URL.createObjectURL(new Blob([bytes], { type: tipo }));
  const link = document.createElement('a');
  link.href = endereco;
  link.download = nome;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(endereco));
}
