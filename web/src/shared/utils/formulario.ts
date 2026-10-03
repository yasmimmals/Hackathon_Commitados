export type ErrosFormulario<T> = Partial<Record<keyof T, string>>;

/** Remove os erros dos campos que acabaram de ser alterados. */
export function limparErros<T>(erros: ErrosFormulario<T>, alterados: Partial<T>): ErrosFormulario<T> {
  const restantes = { ...erros };
  (Object.keys(alterados) as (keyof T)[]).forEach((campo) => delete restantes[campo]);
  return restantes;
}

/** Leva o foco ao primeiro campo com erro. Retorna `true` se havia algum. */
export function focarPrimeiroErro<T>(erros: ErrosFormulario<T>): boolean {
  const primeiro = Object.keys(erros)[0];
  if (!primeiro) return false;
  document.getElementById(primeiro)?.focus();
  return true;
}
