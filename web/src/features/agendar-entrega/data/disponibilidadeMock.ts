import type { Horario } from "../types";

const VAGAS_POR_JANELA = 3;

/**
 * Vagas livres simuladas até a integração com o backend. O valor é estável
 * por data + horário. Domingo fechado e sábado só pela manhã.
 */
export function vagasNoHorario(data: string, horario: Horario): number {
  const diaSemana = new Date(`${data}T12:00:00`).getDay();
  if (diaSemana === 0) return 0;
  if (diaSemana === 6 && horario >= "13:00") return 0;

  let hash = 0;
  for (const c of data + horario) hash = (hash * 31 + c.charCodeAt(0)) % 997;
  return hash % (VAGAS_POR_JANELA + 1);
}
