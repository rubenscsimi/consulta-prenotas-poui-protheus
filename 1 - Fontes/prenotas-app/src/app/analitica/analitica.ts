import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  PoButtonModule,
  PoLoadingModule,
  PoNotificationService,
  PoTableColumn,
  PoTableModule
} from '@po-ui/ng-components';
import { finalize } from 'rxjs';

import { TIPO_XLSX, baixarArquivo } from '../core/arquivo/arquivo';
import { Pagina } from '../core/pagina/pagina';
import { Analitico, PrenotaAnalitica, TotalPrenotas, descricaoFilial } from '../core/prenotas/prenotas';
import { PrenotasService } from '../core/prenotas/prenotas.service';
import { UltimaSinteticaService } from '../core/prenotas/ultima-sintetica.service';

const SEM_PRENOTAS: Analitico = { items: [], total: { quantidade: 0, valor: 0 } };

function linhaTotal(items: PrenotaAnalitica[], { valor }: TotalPrenotas): PrenotaAnalitica {
  return {
    filial: '',
    fornecedor: '',
    loja: '',
    razaoSocial: 'Total de Notas Não Classificadas',
    documento: '',
    serie: '',
    dataDigitacao: '',
    dataEmissao: '',
    valorDocumento: valor,
    valorItens: items.reduce((soma, item) => soma + item.valorItens, 0)
  };
}

@Component({
  selector: 'app-analitica',
  imports: [DatePipe, DecimalPipe, PoButtonModule, PoLoadingModule, PoTableModule],
  templateUrl: './analitica.html',
  styleUrl: './analitica.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Analitica implements OnInit, Pagina {
  private readonly prenotas = inject(PrenotasService);
  private readonly ultima = inject(UltimaSinteticaService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificacao = inject(PoNotificationService);

  readonly titulo = 'Pré-notas não classificadas · Analítica';
  readonly filial = input<string>();

  protected readonly periodo = this.ultima.periodo.asReadonly();
  protected readonly carregando = signal(false);
  protected readonly exportando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly resposta = signal<Analitico | null>(null);

  private readonly analitico = computed(() => this.resposta() ?? SEM_PRENOTAS);

  protected readonly colunas: PoTableColumn[] = [
    { property: 'filial', label: 'Filial' },
    { property: 'fornecedor', label: 'Fornecedor' },
    { property: 'loja', label: 'Loja' },
    { property: 'razaoSocial', label: 'Razão Social' },
    { property: 'documento', label: 'Documento' },
    { property: 'serie', label: 'Série' },
    { property: 'dataDigitacao', label: 'Data de Digitação', type: 'date', format: 'dd/MM/yyyy' },
    { property: 'dataEmissao', label: 'Data de Emissão', type: 'date', format: 'dd/MM/yyyy' },
    { property: 'valorDocumento', label: 'Valor do Documento', type: 'currency', format: 'BRL' },
    { property: 'valorItens', label: 'Valor dos Itens', type: 'currency', format: 'BRL' }
  ];

  protected readonly rotuloFilial = computed(() => {
    const filial = this.filial();
    const item = this.ultima.resposta()?.items.find((prenotas) => prenotas.filial === filial);
    return item ? descricaoFilial(item) : 'Todas as filiais';
  });

  protected readonly quantidade = computed(() => this.analitico().total.quantidade);
  protected readonly exportavel = computed(
    () => !this.carregando() && !this.erro() && this.quantidade() > 0
  );

  protected readonly linhas = computed<PrenotaAnalitica[]>(() => {
    const { items, total } = this.analitico();
    return [...items, linhaTotal(items, total)];
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    const periodo = this.periodo();
    if (!periodo) {
      return;
    }
    this.carregando.set(true);
    this.prenotas
      .analitico(periodo, this.filial())
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (analitico) => {
          this.resposta.set(analitico);
          this.erro.set(null);
        },
        error: (falha: Error) => this.erro.set(falha.message)
      });
  }

  protected exportar(): void {
    const periodo = this.periodo();
    if (!periodo || this.exportando()) {
      return;
    }
    this.exportando.set(true);
    this.prenotas
      .exportarAnalitico(periodo, this.filial())
      .pipe(
        finalize(() => this.exportando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ nome, arquivo }) => baixarArquivo(nome, arquivo, TIPO_XLSX),
        error: (falha: Error) => this.notificacao.error(falha.message)
      });
  }

  protected voltar(): void {
    void this.router.navigate(['']);
  }
}
