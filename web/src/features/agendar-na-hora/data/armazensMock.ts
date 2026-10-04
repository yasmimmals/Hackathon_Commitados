import type { Warehouse, YardEntry } from "../types";

export const ARMAZENS_MOCK: Warehouse[] = [
  {
    id: "adubo", name: "Adubo e Fertilizantes", detail: "Doca 03 • Paletizado / Big Bag", dock: "Doca 03",
    icon: "tractor", slots: 1, accepts: ["paletizado", "bigbag"],
  },
  {
    id: "insumos", name: "Insumos & Defensivos", detail: "Docas 01 e 02 • Bag / Sider", dock: "Docas 01 e 02",
    icon: "flask", slots: 2, accepts: ["paletizado", "bigbag"],
  },
  {
    id: "moega", name: "Moega de Grãos / Granel", detail: "Moega Geral • Descarga Mecânica", dock: "Moega Geral",
    icon: "wheat", slots: 0, unavailableText: "Indisponível Hoje", accepts: ["batido"],
  },
];

export const ENTRADA_VAZIA: YardEntry = {
  notaFiscal: null, plate: "", driver: "", whatsapp: "",
  packaging: "paletizado", warehouse: "adubo", acknowledged: false,
};

