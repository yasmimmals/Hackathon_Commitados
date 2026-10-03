import type { Warehouse, YardEntry } from "../types";

/** Disponibilidade de exemplo até a integração com o backend. */
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
  nfeKey: "", plate: "", driver: "", whatsapp: "",
  packaging: "paletizado", warehouse: "adubo", acknowledged: false,
};

/** Posição inicial na fila de encaixe (simulada). */
export const POSICAO_INICIAL_FILA = 3;
