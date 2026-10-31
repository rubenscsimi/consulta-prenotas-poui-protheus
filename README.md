# Consulta de Pré-notas Não Classificadas — Protheus SIGACOM (PO UI)

Consulta, em PO UI, das pré-notas ainda não classificadas (F1_STATUS em branco) digitadas no período
informado pelo usuário. Tem a tela sintética por filial, com indicadores e gráfico de pizza (Valor ou
Qtde), e a tela analítica da filial ou de todas as filiais. As duas telas exportam para Excel.

Release: TOTVS Protheus 12.1.2510 · Módulo: SIGACOM — Compras · Fontes em TLPP, orientados a classe.

## Conteúdo

| Pasta | O que tem |
|---|---|
| `1 - Video` | vídeo de apresentação narrado (8 min 35 s) |
| `2 - Documentos` | MIT044 (especificação técnica), MIT010 (termo de validação com as telas), manual do usuário e GMUD (plano de implantação, validação e retorno) |
| `3 - Patch` | patch com os 7 objetos (`.ptm`) e a lista do conteúdo |
| `4 - Fontes` | 6 fontes TLPP, o app PO UI compilado (`prenotas.app`) e o fonte Angular do app (`prenotas-app`) |

## Implantação

1. Aplicar o patch `CAPITANI-PRENOTAS-2026-10-30.ptm` no RPO, ou compilar os 6 `.tlpp` (CP1252) e o recurso `prenotas.app`.
2. Incluir no menu do SIGACOM, em Consultas, a função `capitani.compras.prenota.u_prenotas`.
3. Abrir a rotina e informar o período.

Não há dicionário a aplicar: nenhum SX1, SX3, SIX ou parâmetro. O passo a passo completo está na seção 10 do MIT044.

Autor: Rubens Simi
