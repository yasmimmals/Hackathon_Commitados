/** Faixa de retorno anunciada por leitores de tela; fica invisível quando vazia. */
export default function MensagemStatus({ mensagem }: { mensagem: string }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={
        mensagem
          ? "mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800"
          : "sr-only"
      }
    >
      {mensagem}
    </p>
  );
}
