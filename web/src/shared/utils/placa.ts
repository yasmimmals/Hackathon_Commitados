/** Placa no padrão antigo (ABC1234) ou Mercosul (ABC1D23). */
const REGEX_PLACA = /^[A-Z]{3}\d[A-Z\d]\d{2}$/;

export const placaValida = (placa: string) => REGEX_PLACA.test(placa);

export const mascararPlaca = (valor: string) =>
  valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
