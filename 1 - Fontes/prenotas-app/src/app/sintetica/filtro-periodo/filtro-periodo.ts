import {
  ChangeDetectionStrategy,
  Component,
  OutputEmitterRef,
  inject,
  input,
  linkedSignal,
  output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PoButtonModule,
  PoDatepickerIsoFormat,
  PoDatepickerModule,
  PoNotificationService
} from '@po-ui/ng-components';

import { Periodo, motivoPeriodoInvalido } from '../../core/periodo/periodo';

@Component({
  selector: 'app-filtro-periodo',
  imports: [FormsModule, PoButtonModule, PoDatepickerModule],
  templateUrl: './filtro-periodo.html',
  styleUrl: './filtro-periodo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltroPeriodo {
  private readonly notificacao = inject(PoNotificationService);

  readonly periodo = input.required<Periodo>();
  readonly carregando = input(false);
  readonly exportando = input(false);
  readonly exportavel = input(false);
  readonly filtrar = output<Periodo>();
  readonly exportar = output<Periodo>();

  protected readonly formatoIso = PoDatepickerIsoFormat.Basic;
  protected readonly dataInicial = linkedSignal(() => this.periodo().dataInicial);
  protected readonly dataFinal = linkedSignal(() => this.periodo().dataFinal);

  protected aplicar(): void {
    this.emitirSeValido(this.filtrar);
  }

  protected pedirExportacao(): void {
    this.emitirSeValido(this.exportar);
  }

  private emitirSeValido(evento: OutputEmitterRef<Periodo>): void {
    const periodo = { dataInicial: this.dataInicial(), dataFinal: this.dataFinal() };
    const motivo = motivoPeriodoInvalido(periodo);
    if (motivo) {
      this.notificacao.warning(motivo);
      return;
    }
    evento.emit(periodo);
  }
}
