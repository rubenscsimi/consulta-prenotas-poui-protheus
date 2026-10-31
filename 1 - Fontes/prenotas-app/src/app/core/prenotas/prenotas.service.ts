import { Injectable, inject } from '@angular/core';
import { ProJsToAdvplService } from '@totvs/protheus-lib-core';
import { Observable, throwError, timeout } from 'rxjs';

import { FalhaProtheus, RespostaProtheus, lerJson } from '../canal/canal';
import { Periodo } from '../periodo/periodo';
import { Analitico, Planilha, Sintetico, consultaValida, planilhaValida } from './prenotas';

const PEDIDO_SINTETICO = 'sintetico';
const PEDIDO_EXPORTACAO_SINTETICO = 'exportarSintetico';
const PEDIDO_ANALITICO = 'analitico';
const PEDIDO_EXPORTACAO_ANALITICO = 'exportarAnalitico';
const ESPERA_RESPOSTA_MS = 60000;

interface FiltroPrenotas extends Periodo {
  filial?: string;
}

@Injectable({ providedIn: 'root' })
export class PrenotasService {
  private readonly canal = inject(ProJsToAdvplService);

  sintetico(periodo: Periodo): Observable<Sintetico> {
    return this.pedir(PEDIDO_SINTETICO, periodo, responderConsulta<Sintetico>('sintética'));
  }

  exportarSintetico(periodo: Periodo): Observable<Planilha> {
    return this.pedir(PEDIDO_EXPORTACAO_SINTETICO, periodo, responderPlanilha);
  }

  analitico(periodo: Periodo, filial?: string): Observable<Analitico> {
    return this.pedir(PEDIDO_ANALITICO, { ...periodo, filial }, responderConsulta<Analitico>('analítica'));
  }

  exportarAnalitico(periodo: Periodo, filial?: string): Observable<Planilha> {
    return this.pedir(PEDIDO_EXPORTACAO_ANALITICO, { ...periodo, filial }, responderPlanilha);
  }

  private pedir<T>(
    pedido: string,
    { dataInicial, dataFinal, filial }: FiltroPrenotas,
    responder: (resposta: RespostaProtheus<T>) => void
  ): Observable<T> {
    return this.canal
      .buildObservable<T>(responder, {
        receiveId: pedido,
        autoDestruct: true,
        sendInfo: { type: pedido, content: JSON.stringify({ dataInicial, dataFinal, filial }) }
      })
      .pipe(
        timeout({
          first: ESPERA_RESPOSTA_MS,
          with: () => throwError(() => new Error('O Protheus não respondeu a tempo.'))
        })
      );
  }
}

function responderConsulta<T extends Sintetico | Analitico>(visao: string) {
  return ({ protheusResponse, subscriber }: RespostaProtheus<T>): void => {
    const resposta = lerJson<T & FalhaProtheus>(protheusResponse);
    if (consultaValida<T>(resposta)) {
      subscriber.next(resposta);
      subscriber.complete();
    } else {
      subscriber.error(new Error(resposta?.message || `O Protheus não devolveu a consulta ${visao}.`));
    }
  };
}

function responderPlanilha({ protheusResponse, subscriber }: RespostaProtheus<Planilha>): void {
  const resposta = lerJson<Planilha & FalhaProtheus>(protheusResponse);
  if (planilhaValida(resposta)) {
    subscriber.next(resposta);
    subscriber.complete();
  } else {
    subscriber.error(new Error(resposta?.message || 'O Protheus não devolveu a planilha.'));
  }
}
