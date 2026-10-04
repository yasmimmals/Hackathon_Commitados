"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  Contrast, Ear, Focus, Glasses, Hand, Keyboard, Moon, MousePointer2, Palette, RotateCcw,
  ScanLine, Square, Sun, Type, Volume2, X,
} from "lucide-react";
import { useAcessibilidade } from "./ProvedorAcessibilidade";
import { PERFIS, perfilAtivo, type Preferencias, type Tema } from "./preferencias";
import { vozDisponivel } from "./voz";

const ICONES = { Glasses, Palette, Type, Focus, Hand, Ear };

export default function CentralAcessibilidade({ aoFechar }: { aoFechar: () => void }) {
  const { prefs, atualizar, restaurar, anunciar, falar, pararFala } = useAcessibilidade();
  const painel = useRef<HTMLDivElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const el = painel.current;
    el?.querySelector<HTMLElement>("button, input")?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
      if (e.key !== "Tab" || !el) return;
      const focaveis = [...el.querySelectorAll<HTMLElement>("button:not([disabled]), input, [tabindex='0']")];
      const [primeiro, ultimo] = [focaveis[0], focaveis[focaveis.length - 1]];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aoFechar]);

  const mudar = (m: Partial<Preferencias>, aviso: string) => {
    atualizar(m);
    anunciar(aviso);
  };

  const lerPagina = () => {
    const principal = document.getElementById("conteudo-principal") ?? document.body;
    falar(principal.innerText.replace(/\s+/g, " ").slice(0, 4000));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end print:hidden" role="presentation">
      <button type="button" aria-label="Fechar central de acessibilidade" tabIndex={-1}
        onClick={aoFechar} className="absolute inset-0 cursor-default bg-[rgba(0,0,0,0.5)] backdrop-blur-[2px]" />

      <div ref={painel} role="dialog" aria-modal="true" aria-labelledby={tituloId}
        className="relative flex h-full w-full flex-col bg-white text-gray-900 shadow-2xl sm:max-w-md">
        <header className="flex items-start gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex-1">
            <h2 id={tituloId} className="titulo-secao text-xl">Acessibilidade</h2>
            <p className="text-xs text-gray-600">Vale para todas as telas e fica salvo neste aparelho. Atalho: <kbd className="rounded border border-gray-300 px-1">Alt</kbd> + <kbd className="rounded border border-gray-300 px-1">A</kbd></p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <Secao titulo="Perfis prontos" dica="Um toque ajusta tudo. Toque de novo para desfazer.">
            <div className="grid grid-cols-2 gap-2">
              {PERFIS.map((perfil) => {
                const Icone = ICONES[perfil.icone];
                const ativo = perfilAtivo(prefs, perfil);
                return (
                  <button key={perfil.id} type="button" aria-pressed={ativo}
                    onClick={() => {
                      if (ativo) {
                        restaurar();
                      } else {
                        mudar(perfil.ajustes, `Perfil ${perfil.nome} ativado.`);
                      }
                    }}
                    className={`flex min-h-[88px] flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition ${
                      ativo ? "border-site-azul bg-site-azul/10" : "border-gray-200 hover:border-gray-400"}`}>
                    <span className="flex w-full items-center gap-2 text-sm font-semibold">
                      <Icone className="h-4 w-4 shrink-0 text-site-azul" aria-hidden /> {perfil.nome}
                      {ativo && <span className="ml-auto rounded-full bg-site-azul px-1.5 text-[10px] text-white">ativo</span>}
                    </span>
                    <span className="text-[11px] leading-snug text-gray-600">{perfil.descricao}</span>
                  </button>
                );
              })}
            </div>
          </Secao>

          <Secao titulo="Visão">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Tema</legend>
              <div role="radiogroup" className="grid grid-cols-3 gap-2">
                {([["padrao", "Claro", Sun], ["escuro", "Escuro", Moon], ["alto-contraste", "Alto contraste", Contrast]] as const).map(([t, rotulo, Icone]) => (
                  <button key={t} type="button" role="radio" aria-checked={prefs.tema === t}
                    onClick={() => mudar({ tema: t as Tema }, `Tema ${rotulo} ativado.`)}
                    className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border-2 text-xs font-semibold ${
                      prefs.tema === t ? "border-site-azul bg-site-azul/10" : "border-gray-200 hover:border-gray-400"}`}>
                    <Icone className="h-5 w-5" aria-hidden /> {rotulo}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="flex justify-between text-sm font-semibold">
                Tamanho do texto <span className="tabular-nums text-site-azul">{prefs.escalaTexto}%</span>
              </span>
              <input type="range" min={100} max={160} step={5} value={prefs.escalaTexto}
                aria-valuetext={`${prefs.escalaTexto} por cento`}
                onChange={(e) => atualizar({ escalaTexto: Number(e.target.value) })}
                className="mt-2 h-11 w-full accent-site-azul" />
            </label>

            <Interruptor icone={Palette} rotulo="Cores para daltonismo"
              descricao="Troca as cores do site e dos gráficos por pares que se distinguem (paleta Okabe-Ito)."
              ligado={prefs.paleta === "daltonismo"} aoMudar={(v) => mudar({ paleta: v ? "daltonismo" : "padrao" }, v ? "Paleta para daltonismo ativada." : "Paleta padrão.")} />
            {prefs.paleta === "daltonismo" && (
              <Opcoes rotulo="Quais cores você confunde?" valor={prefs.tipoDaltonismo}
                opcoes={[
                  ["vermelho-verde", "Vermelho e verde", "Protanopia ou deuteranopia: verde vira azul, vermelho vira laranja."],
                  ["azul-amarelo", "Azul e amarelo", "Tritanopia: amarelo vira rosa, azul-claro vira cinza."],
                ]}
                aoMudar={(v) => mudar({ tipoDaltonismo: v }, `Cores ajustadas para quem confunde ${v === "vermelho-verde" ? "vermelho e verde" : "azul e amarelo"}.`)} />
            )}
            <Opcoes rotulo="Simular visão (para testes)" valor={prefs.simularVisao} colunas={2}
              opcoes={[
                ["nenhuma", "Visão normal"],
                ["protanopia", "Protanopia"],
                ["deuteranopia", "Deuteranopia"],
                ["tritanopia", "Tritanopia"],
              ]}
              aoMudar={(v) => mudar({ simularVisao: v }, v === "nenhuma" ? "Simulação desligada." : `Simulando ${v}.`)} />
            <Interruptor icone={MousePointer2} rotulo="Cursor grande" ligado={prefs.cursorGrande}
              aoMudar={(v) => atualizar({ cursorGrande: v })} />
          </Secao>

          <Secao titulo="Leitura">
            <Interruptor icone={Type} rotulo="Fonte para dislexia" descricao="Atkinson Hyperlegible: letras que não se confundem."
              ligado={prefs.fonteDislexia} aoMudar={(v) => atualizar({ fonteDislexia: v })} />
            <Interruptor icone={Type} rotulo="Espaçamento de leitura" descricao="Mais espaço entre letras, palavras e linhas."
              ligado={prefs.espacamento} aoMudar={(v) => atualizar({ espacamento: v })} />
            <Interruptor icone={ScanLine} rotulo="Máscara de leitura" descricao="Destaca só a faixa onde está o mouse."
              ligado={prefs.guiaLeitura} aoMudar={(v) => atualizar({ guiaLeitura: v })} />
            <Interruptor icone={Square} rotulo="Destacar links" ligado={prefs.destacarLinks}
              aoMudar={(v) => atualizar({ destacarLinks: v })} />
          </Secao>

          <Secao titulo="Navegação e movimento">
            <Interruptor icone={Keyboard} rotulo="Foco reforçado" descricao="Contorno grosso no item selecionado pelo teclado."
              ligado={prefs.focoReforcado} aoMudar={(v) => atualizar({ focoReforcado: v })} />
            <Interruptor icone={Hand} rotulo="Botões maiores" descricao="Alvos de toque com no mínimo 44 px."
              ligado={prefs.alvosGrandes} aoMudar={(v) => atualizar({ alvosGrandes: v })} />
            <Interruptor icone={Focus} rotulo="Reduzir movimento" descricao="Desliga animações e transições."
              ligado={prefs.reduzirMovimento} aoMudar={(v) => atualizar({ reduzirMovimento: v })} />
          </Secao>

          <Secao titulo="Ouvir" dica={vozDisponivel() ? undefined : "Este navegador não oferece leitura em voz alta."}>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={lerPagina} disabled={!vozDisponivel()}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-site-azul px-3 text-sm font-semibold text-white disabled:opacity-40">
                <Volume2 className="h-4 w-4" aria-hidden /> Ler esta página
              </button>
              <button type="button" onClick={pararFala} disabled={!vozDisponivel()}
                className="min-h-[48px] rounded-xl border-2 border-gray-300 text-sm font-semibold disabled:opacity-40">
                Parar
              </button>
            </div>
            <Interruptor icone={Ear} rotulo="Ler ao selecionar" descricao="Selecione qualquer trecho e ele é lido em voz alta."
              ligado={prefs.lerAoSelecionar} aoMudar={(v) => atualizar({ lerAoSelecionar: v })} />
            <label className="block">
              <span className="flex justify-between text-sm font-semibold">
                Velocidade da voz <span className="tabular-nums text-site-azul">{prefs.velocidadeVoz.toFixed(1)}x</span>
              </span>
              <input type="range" min={0.7} max={1.5} step={0.1} value={prefs.velocidadeVoz}
                aria-valuetext={`${prefs.velocidadeVoz.toFixed(1)} vezes`}
                onChange={(e) => atualizar({ velocidadeVoz: Number(e.target.value) })}
                className="mt-2 h-11 w-full accent-site-azul" />
            </label>
            <p className="rounded-xl bg-gray-100 p-3 text-xs text-gray-700">
              Nos gráficos do painel: <strong>Ouvir resumo</strong> lê a conclusão, <strong>Ouvir gráfico</strong> toca a curva
              como som (mais agudo = maior), e as <strong>setas do teclado</strong> percorrem cada ponto.
            </p>
          </Secao>
        </div>

        <footer className="border-t border-gray-200 px-5 py-3">
          <button type="button" onClick={restaurar}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100">
            <RotateCcw className="h-4 w-4" aria-hidden /> Restaurar padrão
          </button>
        </footer>
      </div>
    </div>
  );
}

function Secao({ titulo, dica, children }: { titulo: string; dica?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">{titulo}</h3>
        {dica && <p className="text-xs text-gray-600">{dica}</p>}
      </div>
      {children}
    </section>
  );
}

function Opcoes<T extends string>({ rotulo, valor, opcoes, aoMudar, colunas = 1 }: {
  rotulo: string; valor: T; opcoes: [T, string, string?][]; aoMudar: (v: T) => void; colunas?: 1 | 2;
}) {
  return (
    <fieldset className="px-2">
      <legend className="mb-2 text-sm font-semibold">{rotulo}</legend>
      <div role="radiogroup" className={`grid gap-2 ${colunas === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {opcoes.map(([v, nome, descricao]) => {
          const ativo = valor === v;
          return (
            <button key={v} type="button" role="radio" aria-checked={ativo} onClick={() => aoMudar(v)}
              className={`flex min-h-[44px] items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs ${
                ativo ? "border-site-azul bg-site-azul/10" : "border-gray-200 hover:border-gray-400"}`}>
              <span aria-hidden className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-site-azul ${ativo ? "bg-site-azul" : ""}`} />
              <span>
                <span className="block font-semibold">{nome}</span>
                {descricao && <span className="block text-[11px] text-gray-600">{descricao}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Interruptor({ icone: Icone, rotulo, descricao, ligado, aoMudar }: {
  icone: typeof Sun; rotulo: string; descricao?: string; ligado: boolean; aoMudar: (v: boolean) => void;
}) {
  return (
    <button type="button" role="switch" aria-checked={ligado} onClick={() => aoMudar(!ligado)}
      className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-50">
      <Icone className="h-5 w-5 shrink-0 text-site-azul" aria-hidden />
      <span className="flex-1">
        <span className="block text-sm font-semibold">{rotulo}</span>
        {descricao && <span className="block text-[11px] text-gray-600">{descricao}</span>}
      </span>
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition ${ligado ? "bg-site-azul" : "bg-gray-300"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${ligado ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}
