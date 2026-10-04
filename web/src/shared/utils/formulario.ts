export type ErrosFormulario<T> = Partial<Record<keyof T, string>>;

export function limparErros<T>(erros: ErrosFormulario<T>, alterados: Partial<T>): ErrosFormulario<T> {
  const restantes = { ...erros };
  (Object.keys(alterados) as (keyof T)[]).forEach((campo) => delete restantes[campo]);
  return restantes;
}

export function focarPrimeiroErro<T>(erros: ErrosFormulario<T>): boolean {
  const primeiro = Object.keys(erros)[0];
  if (!primeiro) return false;
  document.getElementById(primeiro)?.focus();
  return true;
}
