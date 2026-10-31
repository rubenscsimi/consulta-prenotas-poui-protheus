export interface Periodo {
  dataInicial: string;
  dataFinal: string;
}

export type EstadoPeriodo = 'carregando' | 'pronto' | 'foraDoProtheus' | 'semResposta';

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function periodoValido(valor: Partial<Periodo> | null): valor is Periodo {
  return DATA_ISO.test(valor?.dataInicial ?? '') && DATA_ISO.test(valor?.dataFinal ?? '');
}

export function motivoPeriodoInvalido(periodo: Partial<Periodo>): string | null {
  if (!periodoValido(periodo)) {
    return 'Informe a data inicial e a data final.';
  }
  return periodo.dataInicial > periodo.dataFinal
    ? 'A data inicial não pode ser maior que a data final.'
    : null;
}
