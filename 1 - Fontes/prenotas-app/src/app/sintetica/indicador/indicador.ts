import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-indicador',
  templateUrl: './indicador.html',
  styleUrl: './indicador.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Indicador {
  readonly rotulo = input.required<string>();
  readonly icone = input.required<string>();
  readonly valor = input.required<string | null>();
}
