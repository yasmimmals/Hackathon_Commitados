import type { ErrosFormulario } from "@/shared/utils/formulario";

export type WarehouseId = "adubo" | "insumos" | "moega";

export type Packaging = "paletizado" | "bigbag" | "batido";

export interface Warehouse {
  id: WarehouseId;
  name: string;               // ex.: "Adubo e Fertilizantes"
  detail: string;             // ex.: "Doca 03 • Paletizado / Big Bag"
  dock: string;               // ex.: "Doca 03" (usado no select do formulário)
  icon: "tractor" | "flask" | "wheat";
  slots: number;              // vagas livres agora (0 = indisponível)
  unavailableText?: string;   // ex.: "Indisponível Hoje"
  accepts: Packaging[];       // acondicionamentos aceitos
}

export interface YardEntry {
  nfeKey: string;             // chave de acesso com 44 dígitos
  plate: string;
  driver: string;
  whatsapp: string;
  packaging: Packaging;
  warehouse: WarehouseId;
  acknowledged: boolean;      // ciente da prioridade dos agendamentos programados
}

export type YardEntryErrors = ErrosFormulario<YardEntry>;
