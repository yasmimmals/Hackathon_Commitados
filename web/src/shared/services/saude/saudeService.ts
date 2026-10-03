import { api } from "../api";
import type { Health } from "./types";

/** GET /health — verifica se a API e o banco estão no ar. */
export async function verificarSaude(): Promise<Health> {
  const { data } = await api.get<Health>("/health");
  return data;
}
