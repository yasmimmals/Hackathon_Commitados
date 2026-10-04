import { api } from "../api";
import type { Boletim, BoletimCreate, ChapaNoBoletimIn, FiltrosBoletim, LinhaProducaoIn } from "./types";

const BASE = "/boletins";

export async function abrirBoletim(dados: BoletimCreate): Promise<Boletim> {
  const { data } = await api.post<Boletim>(BASE, dados);
  return data;
}

export async function listarBoletins(filtros: FiltrosBoletim = {}): Promise<Boletim[]> {
  const { data } = await api.get<Boletim[]>(BASE, { params: filtros });
  return data;
}

export async function buscarBoletim(id: number): Promise<Boletim> {
  const { data } = await api.get<Boletim>(`${BASE}/${id}`);
  return data;
}

export async function lancarProducao(id: number, linhas: LinhaProducaoIn[]): Promise<Boletim> {
  const { data } = await api.put<Boletim>(`${BASE}/${id}/producao`, { linhas });
  return data;
}

export async function definirEquipe(id: number, equipe: ChapaNoBoletimIn[]): Promise<Boletim> {
  const { data } = await api.put<Boletim>(`${BASE}/${id}/equipe`, { equipe });
  return data;
}

export async function fecharBoletim(id: number, fechadoPor: string): Promise<Boletim> {
  const { data } = await api.post<Boletim>(`${BASE}/${id}/fechar`, { fechado_por: fechadoPor });
  return data;
}

export async function reabrirBoletim(id: number): Promise<Boletim> {
  const { data } = await api.post<Boletim>(`${BASE}/${id}/reabrir`);
  return data;
}

export async function baixarBoletimExcel(id: number): Promise<{ arquivo: Blob; nome: string }> {
  const resposta = await api.get<Blob>(`${BASE}/${id}/excel`, { responseType: "blob" });
  const disposicao = String(resposta.headers["content-disposition"] ?? "");
  const nome = /filename="?([^"]+)"?/.exec(disposicao)?.[1] ?? `boletim-${id}.xlsx`;
  return { arquivo: resposta.data, nome };
}
