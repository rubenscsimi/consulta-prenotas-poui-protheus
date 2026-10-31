import { Injectable, signal } from '@angular/core';

import { Periodo } from '../periodo/periodo';
import { Sintetico } from './prenotas';

@Injectable({ providedIn: 'root' })
export class UltimaSinteticaService {
  readonly periodo = signal<Periodo | null>(null);
  readonly resposta = signal<Sintetico | null>(null);
}
