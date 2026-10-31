import { Subscriber } from 'rxjs';

export interface RespostaProtheus<T> {
  protheusResponse: string;
  subscriber: Subscriber<T>;
}

export interface FalhaProtheus {
  code: string;
  message: string;
  detailedMessage: string;
}

export function lerJson<T>(conteudo: string): Partial<T> | null {
  try {
    return JSON.parse(conteudo);
  } catch {
    return null;
  }
}
