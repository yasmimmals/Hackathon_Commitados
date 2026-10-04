export function vozDisponivel() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function vozPortugues(): SpeechSynthesisVoice | undefined {
  const vozes = window.speechSynthesis.getVoices();
  return vozes.find((v) => v.lang === "pt-BR") ?? vozes.find((v) => v.lang.startsWith("pt"));
}

export function falar(texto: string, velocidade = 1, aoTerminar?: () => void) {
  if (!vozDisponivel() || !texto.trim()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "pt-BR";
  u.rate = velocidade;
  const v = vozPortugues();
  if (v) u.voice = v;
  if (aoTerminar) u.onend = aoTerminar;
  window.speechSynthesis.speak(u);
}

export function pararFala() {
  if (vozDisponivel()) window.speechSynthesis.cancel();
}

let contexto: AudioContext | null = null;

export function sonificar(valores: number[], { duracaoNota = 0.22, aoTerminar }: { duracaoNota?: number; aoTerminar?: () => void } = {}) {
  const validos = valores.filter((v) => Number.isFinite(v));
  if (typeof window === "undefined" || !validos.length) return () => {};
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return () => {};
  contexto = contexto ?? new Ctx();
  const ctx = contexto;
  void ctx.resume();
  const min = Math.min(...validos);
  const max = Math.max(...validos);
  const inicio = ctx.currentTime + 0.05;
  const osciladores: OscillatorNode[] = [];
  valores.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const t = inicio + i * duracaoNota;
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 220 * Math.pow(4, max === min ? 0.5 : (v - min) / (max - min));
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracaoNota * 0.9);
    osc.connect(ganho).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duracaoNota);
    osciladores.push(osc);
  });
  const fim = window.setTimeout(() => aoTerminar?.(), (valores.length * duracaoNota + 0.1) * 1000);
  return () => {
    window.clearTimeout(fim);
    osciladores.forEach((o) => {
      try {
        o.stop();
      } catch {
      }
    });
  };
}
