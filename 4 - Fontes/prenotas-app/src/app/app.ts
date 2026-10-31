import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PoLoadingModule, PoPageAction, PoPageModule } from '@po-ui/ng-components';
import { ProAppConfigService } from '@totvs/protheus-lib-core';

import { Pagina } from './core/pagina/pagina';
import { PeriodoService } from './core/periodo/periodo.service';

const TITULO_DO_APP = 'Pré-notas não classificadas';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PoPageModule, PoLoadingModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  private readonly appConfig = inject(ProAppConfigService);
  protected readonly periodoService = inject(PeriodoService);
  protected readonly titulo = signal(TITULO_DO_APP);

  private readonly sair: PoPageAction = {
    label: 'Sair',
    icon: 'an an-sign-out',
    action: () => this.appConfig.callAppClose(false)
  };

  protected readonly acoes = computed(() =>
    this.periodoService.estado() === 'foraDoProtheus' ? [] : [this.sair]
  );

  ngOnInit(): void {
    this.periodoService.solicitar();
  }

  protected mostrar(pagina: Partial<Pagina>): void {
    this.titulo.set(pagina.titulo ?? TITULO_DO_APP);
  }
}
