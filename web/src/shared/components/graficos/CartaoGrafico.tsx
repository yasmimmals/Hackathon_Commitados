import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AudioLines, ChartColumn, Download, Pause, Table2, Volume2 } from "lucide-react";
import { useAcessibilidade, sonificar } from "@/shared/acessibilidade";

export type ColunaTabela<T> = { rotulo: string; valor: (linha: T) => string | number; alinhar?: "direita" };

/**
 * Cartão de gráfico acessível. Além do gráfico em si, oferece:
 *  - Tabela: os mesmos dados em formato de tabela (leitores de tela e quem prefere números);
 *  - Ouvir resumo: a conclusão do gráfico em voz alta;
 *  - Ouvir gráfico: a série vira som (mais agudo = maior) e o ponto tocado se acende;
 *  - Teclado: com o gráfico focado, ← → percorrem os pontos e cada um é anunciado;
 *  - CSV: baixa os dados para abrir no Excel.
 * `children` recebe o índice do ponto em foco para desenhar o destaque.
 */
export default function CartaoGrafico<T>({
  titulo, subtitulo, resumo, serieSonora, pontos, tabela, arquivo, legenda, altura = "h-[260px] sm:h-[320px]", controles, children,
}: {
  titulo: string;
  subtitulo?: string;
  resumo: string;
  serieSonora: number[];
  pontos: string[];
  tabela: { colunas: ColunaTabela<T>[]; linhas: T[] };
  arquivo: string;
  legenda?: ReactNode;
  altura?: string;
  controles?: ReactNode;
  children: (foco: number | null) => ReactNode;
}) {
  const { falar, pararFala, anunciar, prefs } = useAcessibilidade();
  const [modo, setModo] = useState<"grafico" | "tabela">("grafico");
  const [foco, setFoco] = useState<number | null>(null);
  const [tocando, setTocando] = useState(false);
  const parar = useRef<() => void>(() => {});
  const passo = useRef<number | undefined>(undefined);
  const tituloId = useId();
  const instrucoesId = useId();

  useEffect(() => () => {
    parar.current();
    window.clearInterval(passo.current);
  }, []);

  const pararSom = () => {
    parar.current();
    window.clearInterval(passo.current);
    setTocando(false);
    setFoco(null);
  };

  const tocar = () => {
    if (tocando) return pararSom();
    const duracao = prefs.reduzirMovimento ? 0.3 : 0.22;
    setTocando(true);
    let i = 0;
    setFoco(0);
    passo.current = window.setInterval(() => {
      i += 1;
      if (i >= serieSonora.length) window.clearInterval(passo.current);
      else setFoco(i);
    }, duracao * 1000);
    parar.current = sonificar(serieSonora, { duracaoNota: duracao, aoTerminar: () => { setTocando(false); setFoco(null); } });
    anunciar(`Tocando ${titulo}: som mais agudo significa valor maior.`);
  };

  const teclado = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!pontos.length) return;
    let novo: number | null = foco;
    if (e.key === "ArrowRight") novo = foco == null ? 0 : Math.min(pontos.length - 1, foco + 1);
    else if (e.key === "ArrowLeft") novo = foco == null ? pontos.length - 1 : Math.max(0, foco - 1);
    else if (e.key === "Home") novo = 0;
    else if (e.key === "End") novo = pontos.length - 1;
    else if (e.key === "Escape") novo = null;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      falar(resumo);
      return;
    } else return;
    e.preventDefault();
    setFoco(novo);
    if (novo != null) anunciar(`${pontos[novo]}. Ponto ${novo + 1} de ${pontos.length}.`);
  };

  const baixarCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const linhas = [
      tabela.colunas.map((c) => esc(c.rotulo)).join(";"),
      ...tabela.linhas.map((l) => tabela.colunas.map((c) => esc(c.valor(l))).join(";")),
    ];
    const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${arquivo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const botao = "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition";
  const neutro = `${botao} text-gray-700 hover:bg-gray-100`;

  return (
    <figure className="flex flex-col rounded-3xl bg-white p-4 shadow-sm sm:p-5" aria-labelledby={tituloId}>
      <figcaption className="mb-3 flex flex-col gap-2 border-b-[3px] border-site-amarelo pb-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 id={tituloId} className="titulo-secao text-base sm:text-lg">{titulo}</h3>
          {subtitulo && <p className="mt-0.5 text-xs text-gray-500">{subtitulo}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label={`Ações do gráfico ${titulo}`}>
          <div className="mr-1 flex rounded-full bg-gray-100 p-0.5" role="group" aria-label="Formato">
            <button type="button" aria-pressed={modo === "grafico"} onClick={() => setModo("grafico")}
              className={`${botao} ${modo === "grafico" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>
              <ChartColumn className="h-3.5 w-3.5" aria-hidden /> Gráfico
            </button>
            <button type="button" aria-pressed={modo === "tabela"} onClick={() => setModo("tabela")}
              className={`${botao} ${modo === "tabela" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>
              <Table2 className="h-3.5 w-3.5" aria-hidden /> Tabela
            </button>
          </div>
          <button type="button" className={neutro} onClick={() => falar(resumo)} onDoubleClick={pararFala}
            title="Lê a conclusão do gráfico em voz alta">
            <Volume2 className="h-3.5 w-3.5" aria-hidden /> <span className="hidden sm:inline">Ouvir resumo</span>
            <span className="sr-only sm:hidden">Ouvir resumo</span>
          </button>
          <button type="button" className={`${neutro} ${tocando ? "bg-site-azul/10 text-site-azul" : ""}`} onClick={tocar}
            aria-pressed={tocando} title="Toca a curva como som: mais agudo = valor maior">
            {tocando ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <AudioLines className="h-3.5 w-3.5" aria-hidden />}
            <span className="hidden sm:inline">{tocando ? "Parar" : "Ouvir gráfico"}</span>
            <span className="sr-only sm:hidden">{tocando ? "Parar som" : "Ouvir gráfico"}</span>
          </button>
          <button type="button" className={neutro} onClick={baixarCsv} title="Baixar os dados (abre no Excel)">
            <Download className="h-3.5 w-3.5" aria-hidden /> <span className="hidden sm:inline">CSV</span>
            <span className="sr-only sm:hidden">Baixar CSV</span>
          </button>
        </div>
      </figcaption>

      {controles}

      {modo === "grafico" ? (
        <>
          <div
            role="group"
            tabIndex={0}
            aria-roledescription="gráfico interativo"
            aria-labelledby={tituloId}
            aria-describedby={instrucoesId}
            onKeyDown={teclado}
            onBlur={() => !tocando && setFoco(null)}
            className={`relative w-full rounded-xl ${altura}`}
          >
            <p id={instrucoesId} className="sr-only">
              {resumo} Use as setas para a esquerda e direita para percorrer os pontos e Enter para ouvir o resumo.
            </p>
            {children(foco)}
          </div>
          <div className="mt-2 flex min-h-[24px] flex-wrap items-center justify-between gap-2">
            {legenda ?? <span />}
            {foco != null && pontos[foco] && (
              <span className="rounded-full bg-gray-900 px-3 py-1 text-[11px] font-semibold text-white" aria-hidden>
                {pontos[foco]}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="max-h-[420px] overflow-auto rounded-xl ring-1 ring-gray-200">
          <table className="w-full min-w-[480px] text-left text-sm">
            <caption className="sr-only">{titulo}</caption>
            <thead className="sticky top-0 bg-gray-50 text-xs text-gray-600">
              <tr>
                {tabela.colunas.map((c) => (
                  <th key={c.rotulo} scope="col" className={`px-3 py-2 font-semibold ${c.alinhar === "direita" ? "text-right" : ""}`}>{c.rotulo}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 tabular-nums">
              {tabela.linhas.map((l, i) => (
                <tr key={i}>
                  {tabela.colunas.map((c, j) => {
                    const Cel = j === 0 ? "th" : "td";
                    return (
                      <Cel key={c.rotulo} {...(j === 0 ? { scope: "row" } : {})}
                        className={`px-3 py-2 ${j === 0 ? "font-medium text-gray-900" : ""} ${c.alinhar === "direita" ? "text-right" : ""}`}>
                        {c.valor(l)}
                      </Cel>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

/** Legenda simples e clicável não é obrigatória; esta é só visual (os dados estão na tabela). */
export function Legenda({ itens }: { itens: { cor: string; rotulo: string; tracejado?: boolean; faixa?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-700">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-1.5">
          <span aria-hidden className={i.faixa ? "h-3 w-4 rounded-sm opacity-40" : i.tracejado ? "h-0 w-4 border-t-2 border-dashed" : "h-3 w-3 rounded-sm"}
            style={i.tracejado ? { borderColor: i.cor } : { background: i.cor }} />
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}
