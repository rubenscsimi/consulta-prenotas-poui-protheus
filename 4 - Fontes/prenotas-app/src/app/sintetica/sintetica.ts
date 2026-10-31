import { CurrencyPipe, DecimalPipe, formatCurrency, formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  PoButtonGroupItem,
  PoButtonGroupModule,
  PoButtonGroupToggle,
  PoButtonModule,
  PoChartModule,
  PoChartOptions,
  PoChartSerie,
  PoChartType,
  PoLoadingModule,
  PoNotificationService,
  PoTableColumn,
  PoTableModule
} from '@po-ui/ng-components';
import { finalize } from 'rxjs';

import { TIPO_XLSX, baixarArquivo } from '../core/arquivo/arquivo';
import { Periodo } from '../core/periodo/periodo';
import { PeriodoService } from '../core/periodo/periodo.service';
import { Sintetico, descricaoFilial } from '../core/prenotas/prenotas';
import { PrenotasService } from '../core/prenotas/prenotas.service';
import { UltimaSinteticaService } from '../core/prenotas/ultima-sintetica.service';
import { FiltroPeriodo } from './filtro-periodo/filtro-periodo';
import { Indicador } from './indicador/indicador';

type Metrica = 'valor' | 'quantidade';

export interface LinhaSintetica {
  filial: string | null;
  descricao: string;
  quantidade: number;
  valor: number;
  percentual: number;
}

const SEM_PRENOTAS: Sintetico = { items: [], total: { quantidade: 0, valor: 0 } };

const ROTULOS_METRICA: Record<Metrica, string> = {
  valor: 'Valor',
  quantidade: 'Qtde'
};

function participacao(parte: number, todo: number): number {
  return todo ? (parte / todo) * 100 : 0;
}

@Component({
  selector: 'app-sintetica',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    PoButtonGroupModule,
    PoButtonModule,
    PoChartModule,
    PoLoadingModule,
    PoTableModule,
    FiltroPeriodo,
    Indicador
  ],
  templateUrl: './sintetica.html',
  styleUrl: './sintetica.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sintetica implements OnInit {
  private readonly prenotas = inject(PrenotasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LOCALE_ID);
  private readonly notificacao = inject(PoNotificationService);
  private readonly router = inject(Router);
  private readonly ultima = inject(UltimaSinteticaService);
  private readonly periodoDaRotina = inject(PeriodoService).periodo;

  protected readonly carregando = signal(false);
  protected readonly exportando = signal(false);
  protected readonly falhou = signal(false);
  protected readonly metrica = signal<Metrica>('valor');
  protected readonly resposta = this.ultima.resposta.asReadonly();
  private readonly periodoConsultado = this.ultima.periodo;

  protected readonly periodoDoFiltro = computed(() => this.periodoConsultado() ?? this.periodoDaRotina());
  private readonly sintetico = computed(() => this.resposta() ?? SEM_PRENOTAS);

  protected readonly tipoGrafico = PoChartType.Pie;
  protected readonly selecaoUnica = PoButtonGroupToggle.Single;
  protected readonly opcoesGrafico: PoChartOptions = {
    header: { hideTableDetails: true, hideExpand: true, hideExportCsv: true, hideExportImage: true }
  };
  protected readonly colunas: PoTableColumn[] = [
    { property: 'descricao', label: 'Filial', type: 'cellTemplate' },
    { property: 'quantidade', label: 'Qtde Notas', type: 'number' },
    { property: 'valor', label: 'Valor Total das Notas', type: 'currency', format: 'BRL' },
    { property: 'percentual', label: '% do total', type: 'number', format: '1.2-2' }
  ];
  protected readonly opcoesMetrica: PoButtonGroupItem[] = (['valor', 'quantidade'] as const).map(
    (metrica) => ({
      label: ROTULOS_METRICA[metrica],
      selected: metrica === this.metrica(),
      action: (botao: PoButtonGroupItem) => {
        // O po-button-group em modo single desmarca o botão já marcado quando clicado de novo.
        botao.selected = true;
        this.metrica.set(metrica);
      }
    })
  );

  protected readonly total = computed(() => this.sintetico().total);
  protected readonly filiaisComPendencia = computed(() => this.sintetico().items.length);
  protected readonly exportavel = computed(
    () => !this.carregando() && !this.falhou() && this.filiaisComPendencia() > 0
  );
  protected readonly valorMedio = computed(() => {
    const { quantidade, valor } = this.total();
    return quantidade ? valor / quantidade : 0;
  });

  protected readonly linhas = computed<LinhaSintetica[]>(() => {
    const { items, total } = this.sintetico();
    return [
      ...items.map((item) => ({
        filial: item.filial,
        descricao: descricaoFilial(item),
        quantidade: item.quantidade,
        valor: item.valor,
        percentual: participacao(item.valor, total.valor)
      })),
      {
        filial: null,
        descricao: 'Total de Notas Não Classificadas',
        ...total,
        percentual: participacao(total.valor, total.valor)
      }
    ];
  });

  private readonly valoresGrafico = computed(() => {
    const metrica = this.metrica();
    const { items, total } = this.sintetico();
    return items.map((item) => ({
      rotulo: item.nomeFilial,
      valor: item[metrica],
      texto: this.formatar(metrica, item[metrica]),
      percentual: `${formatNumber(participacao(item[metrica], total[metrica]), this.locale, '1.2-2')} %`
    }));
  });

  protected readonly fatias = computed<PoChartSerie[]>(() =>
    this.valoresGrafico().map(({ rotulo, valor, texto, percentual }) => ({
      label: `${rotulo} · ${percentual}`,
      data: valor,
      tooltip: `${rotulo}: **${texto}** (${percentual})`
    }))
  );

  protected readonly descricaoGrafico = computed(() => {
    const fatias = this.valoresGrafico().map(
      ({ rotulo, texto, percentual }) => `${rotulo} ${texto} (${percentual})`
    );
    return `Gráfico de pizza, ${ROTULOS_METRICA[this.metrica()]} por filial: ${fatias.join('; ')}`;
  });

  ngOnInit(): void {
    const periodo = this.periodoDoFiltro();
    if (periodo && !this.resposta()) {
      this.carregar(periodo);
    }
  }

  protected carregar(periodo: Periodo): void {
    this.periodoConsultado.set(periodo);
    this.carregando.set(true);
    this.prenotas
      .sintetico(periodo)
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (sintetico) => {
          this.ultima.resposta.set(sintetico);
          this.falhou.set(false);
        },
        error: () => this.falhou.set(true)
      });
  }

  protected exportar(periodo: Periodo): void {
    if (this.exportando()) {
      return;
    }
    this.exportando.set(true);
    this.prenotas
      .exportarSintetico(periodo)
      .pipe(
        finalize(() => this.exportando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ nome, arquivo }) => baixarArquivo(nome, arquivo, TIPO_XLSX),
        error: (erro: Error) => this.notificacao.error(erro.message)
      });
  }

  protected abrirAnalitica({ filial }: LinhaSintetica): void {
    void this.router.navigate(['analitica'], { queryParams: { filial } });
  }

  protected tentarDeNovo(): void {
    const periodo = this.periodoConsultado();
    if (periodo) {
      this.carregar(periodo);
    }
  }

  private formatar(metrica: Metrica, valor: number): string {
    return metrica === 'valor'
      ? formatCurrency(valor, this.locale, 'R$', 'BRL')
      : formatNumber(valor, this.locale);
  }
}
