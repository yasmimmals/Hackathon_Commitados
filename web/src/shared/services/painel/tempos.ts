import { api } from "@/shared/services/api";

export type TemposPeriodo = {
  fonte: string;
  espera_media_min: number | null;
  espera_max_min: number | null;
  descarga_media_min: number | null;
  descarga_media_por_armazem_min: Record<string, number>;
  caminhoes_medidos: number;
  descargas_medidas: number;
  premissa: string;
};

export type TempoMes = TemposPeriodo & { mes: string };

const doisDigitos = (n: number) => String(n).padStart(2, "0");

export async function obterTemposPorMes(meses = 12, hoje = new Date()): Promise<TempoMes[]> {
  const periodos = Array.from({ length: meses }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1 - i), 1);
    const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const mes = `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}`;
    return { mes, inicio: `${mes}-01`, fim: `${mes}-${doisDigitos(ultimoDia)}` };
  });
  return Promise.all(
    periodos.map(async ({ mes, inicio, fim }) => {
      const { data } = await api.get<TemposPeriodo>("/painel/tempos", { params: { inicio, fim } });
      return { ...data, mes };
    }),
  );
}
