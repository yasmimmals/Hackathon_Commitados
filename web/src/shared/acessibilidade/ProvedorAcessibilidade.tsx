"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import CentralAcessibilidade from "./CentralAcessibilidade";
import MascaraLeitura from "./MascaraLeitura";
import { PADRAO, aplicarNoDocumento, carregar, salvar, type Preferencias } from "./preferencias";
import { falar, pararFala } from "./voz";

type Contexto = {
  prefs: Preferencias;
  atualizar: (mudanca: Partial<Preferencias>) => void;
  restaurar: () => void;
  /** Mensagem lida por leitores de tela sem mudar o foco (região aria-live). */
  anunciar: (mensagem: string) => void;
  falar: (texto: string) => void;
  pararFala: () => void;
  abrirCentral: () => void;
};

const Ctx = createContext<Contexto | null>(null);

export function useAcessibilidade() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAcessibilidade precisa do ProvedorAcessibilidade");
  return c;
}

export default function ProvedorAcessibilidade({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferencias>(PADRAO);
  const [pronto, setPronto] = useState(false);
  const [aberta, setAberta] = useState(false);
  const [aviso, setAviso] = useState("");
  const gatilho = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPrefs(carregar());
    setPronto(true);
  }, []);

  useEffect(() => {
    if (!pronto) return;
    aplicarNoDocumento(prefs);
    salvar(prefs);
  }, [prefs, pronto]);

  const anunciar = useCallback((m: string) => {
    setAviso("");
    window.setTimeout(() => setAviso(m), 30);   // limpar antes garante a releitura de mensagens iguais
  }, []);

  const atualizar = useCallback((m: Partial<Preferencias>) => setPrefs((p) => ({ ...p, ...m })), []);
  const restaurar = useCallback(() => {
    setPrefs(PADRAO);
    anunciar("Preferências de acessibilidade restauradas para o padrão.");
  }, [anunciar]);

  // Alt + A abre a central de qualquer tela
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setAberta((v) => !v);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  // Ler ao selecionar: selecionou um trecho com o mouse ou teclado, ouve na hora
  useEffect(() => {
    if (!prefs.lerAoSelecionar) return;
    const aoSoltar = () => {
      const t = window.getSelection()?.toString().trim();
      if (t && t.length > 1) falar(t, prefs.velocidadeVoz);
    };
    document.addEventListener("mouseup", aoSoltar);
    document.addEventListener("keyup", aoSoltar);
    return () => {
      document.removeEventListener("mouseup", aoSoltar);
      document.removeEventListener("keyup", aoSoltar);
    };
  }, [prefs.lerAoSelecionar, prefs.velocidadeVoz]);

  const valor = useMemo<Contexto>(() => ({
    prefs, atualizar, restaurar, anunciar,
    falar: (t) => falar(t, prefs.velocidadeVoz),
    pararFala,
    abrirCentral: () => setAberta(true),
  }), [prefs, atualizar, restaurar, anunciar]);

  return (
    <Ctx.Provider value={valor}>
      {children}

      <button
        ref={gatilho}
        type="button"
        onClick={() => setAberta(true)}
        aria-haspopup="dialog"
        aria-expanded={aberta}
        aria-keyshortcuts="Alt+A"
        title="Acessibilidade (Alt + A)"
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-site-azul text-white shadow-xl ring-4 ring-white/70 transition hover:scale-105 hover:bg-site-azul-escuro focus-visible:outline-none focus-visible:ring-site-amarelo print:hidden sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3"
      >
        <IconeAcessibilidade />
        <span className="sr-only sm:not-sr-only sm:text-sm sm:font-semibold">Acessibilidade</span>
      </button>

      {aberta && (
        <CentralAcessibilidade
          aoFechar={() => {
            setAberta(false);
            gatilho.current?.focus();
          }}
        />
      )}

      {prefs.guiaLeitura && <MascaraLeitura />}

      <div aria-live="polite" aria-atomic="true" className="sr-only">{aviso}</div>
    </Ctx.Provider>
  );
}

/** Símbolo internacional de acessibilidade (figura de braços abertos). */
function IconeAcessibilidade() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10.5" />
      <circle cx="12" cy="6.6" r="1.4" fill="currentColor" stroke="none" />
      <path d="M6.5 9.3c3.6 1 7.4 1 11 0M12 10v4.2M12 14.2l-2.6 4.6M12 14.2l2.6 4.6" />
    </svg>
  );
}
