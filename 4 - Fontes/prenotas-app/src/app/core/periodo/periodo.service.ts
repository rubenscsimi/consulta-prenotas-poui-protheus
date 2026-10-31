import { Injectable, inject, signal } from '@angular/core';
import { ProJsToAdvplService } from '@totvs/protheus-lib-core';
import { first, timeout, timer } from 'rxjs';

import { RespostaProtheus, lerJson } from '../canal/canal';
import { EstadoPeriodo, Periodo, periodoValido } from './periodo';

const CHAVE_PERIODO = 'periodo';
const INTERVALO_CANAL_MS = 100;
const ESPERA_CANAL_MS = 3000;
const ESPERA_RESPOSTA_MS = 10000;

@Injectable({ providedIn: 'root' })
export class PeriodoService {
  private readonly canal = inject(ProJsToAdvplService);

  readonly estado = signal<EstadoPeriodo>('carregando');
  readonly periodo = signal<Periodo | null>(null);

  solicitar(): void {
    timer(0, INTERVALO_CANAL_MS)
      .pipe(
        first(() => !!this.canal.getWebChannel()),
        timeout({ first: ESPERA_CANAL_MS })
      )
      .subscribe({
        next: () => this.pedirAoProtheus(),
        error: () => this.estado.set('foraDoProtheus')
      });
  }

  private pedirAoProtheus(): void {
    this.canal
      .buildObservable<Periodo>(responder, {
        receiveId: CHAVE_PERIODO,
        autoDestruct: true,
        sendInfo: { type: CHAVE_PERIODO }
      })
      .pipe(timeout({ first: ESPERA_RESPOSTA_MS }))
      .subscribe({
        next: (periodo) => {
          this.periodo.set(periodo);
          this.estado.set('pronto');
        },
        error: () => this.estado.set('semResposta')
      });
  }
}

function responder({ protheusResponse, subscriber }: RespostaProtheus<Periodo>): void {
  const periodo = lerJson<Periodo>(protheusResponse);
  if (periodoValido(periodo)) {
    subscriber.next(periodo);
    subscriber.complete();
  } else {
    subscriber.error(new Error('Período recebido do Protheus fora do formato AAAA-MM-DD.'));
  }
}
