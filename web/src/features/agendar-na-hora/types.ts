import type { NotaFiscal } from "@/shared/services";
import type { ErrosFormulario } from "@/shared/utils/formulario";

export type WarehouseId = "adubo" | "insumos" | "moega";

export type Packaging = "paletizado" | "bigbag" | "batido";

export interface Warehouse {
  id: WarehouseId;
  name: string;
  detail: string;
  dock: string;
  icon: "tractor" | "flask" | "wheat";
  slots: number;
  unavailableText?: string;
  accepts: Packaging[];
}

export interface YardEntry {
  notaFiscal: NotaFiscal | null;
  plate: string;
  driver: string;
  whatsapp: string;
  packaging: Packaging;
  warehouse: WarehouseId;
  acknowledged: boolean;
}

export type YardEntryErrors = ErrosFormulario<YardEntry>;
