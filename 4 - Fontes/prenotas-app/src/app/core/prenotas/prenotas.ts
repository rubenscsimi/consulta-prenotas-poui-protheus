export interface TotalPrenotas {
  quantidade: number;
  valor: number;
}

export interface PrenotasFilial extends TotalPrenotas {
  filial: string;
  nomeFilial: string;
}

export interface Sintetico {
  items: PrenotasFilial[];
  total: TotalPrenotas;
}

export interface PrenotaAnalitica {
  filial: string;
  fornecedor: string;
  loja: string;
  razaoSocial: string;
  documento: string;
  serie: string;
  dataDigitacao: string;
  dataEmissao: string;
  valorDocumento: number;
  valorItens: number;
}

export interface Analitico {
  items: PrenotaAnalitica[];
  total: TotalPrenotas;
}

export interface Planilha {
  nome: string;
  arquivo: string;
}

export function planilhaValida(valor: Partial<Planilha> | null): valor is Planilha {
  return typeof valor?.nome === 'string' && typeof valor?.arquivo === 'string';
}

export function consultaValida<T extends Sintetico | Analitico>(valor: Partial<T> | null): valor is T {
  return Array.isArray(valor?.items) && typeof valor?.total?.quantidade === 'number';
}

export function descricaoFilial({ filial, nomeFilial }: PrenotasFilial): string {
  return `${filial} – ${nomeFilial}`;
}
