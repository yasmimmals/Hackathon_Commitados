import { api } from "../api";
import type { Health } from "./types";

export async function verificarSaude(): Promise<Health> {
  const { data } = await api.get<Health>("/health");
  return data;
}
