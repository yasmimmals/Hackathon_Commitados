/**
 * Tipos comuns a vários assuntos, espelhando o backend (app/schemas e app/models).
 * Os tipos específicos ficam na pasta de cada assunto.
 *
 * Convenções de serialização do FastAPI/Pydantic:
 *  - date      -> "YYYY-MM-DD"
 *  - datetime  -> ISO 8601
 *  - Decimal   -> string (ex.: "12500.50"); converta com Number() quando precisar calcular
 */

export type DataISO = string;
export type DataHoraISO = string;
export type Decimal = string;

export type Horario = "08:00" | "10:00" | "13:00" | "15:00";

export type Acondicionamento = "BATIDO" | "PALETIZADO" | "BIG_BAG";

export type LocalFisico = "INSUMOS" | "ADUBO" | "MAQUINAS" | "LOJA";

/** Procedência do registro (campo `origem_dado`). */
export type Origem = "HISTORICO" | "SISTEMA" | "TESTE";
