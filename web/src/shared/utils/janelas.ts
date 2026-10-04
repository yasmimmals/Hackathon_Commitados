import type { Horario } from "@/shared/services";

export const JANELAS: { horario: Horario; fim: string }[] = [
  { horario: "08:00", fim: "10:00" },
  { horario: "10:00", fim: "13:00" },
  { horario: "13:00", fim: "15:00" },
  { horario: "15:00", fim: "17:30" },
];

export function dataLocalIso(dias = 0, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const horaAgora = (agora: Date) => agora.toTimeString().slice(0, 5);

export function janelaAtual(agora = new Date()): Horario | undefined {
  return JANELAS.find(({ fim }) => horaAgora(agora) < fim)?.horario;
}

export function janelaTerminou(data: string, horario: Horario, agora = new Date()) {
  const hoje = dataLocalIso(0, agora);
  if (data !== hoje) return data < hoje;
  const fim = JANELAS.find((j) => j.horario === horario)?.fim ?? "23:59";
  return horaAgora(agora) >= fim;
}
