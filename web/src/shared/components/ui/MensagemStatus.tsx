const TOM = {
  sucesso: "border-emerald-200 bg-emerald-50 text-emerald-800",
  erro: "border-red-200 bg-red-50 text-red-800",
};

export default function MensagemStatus({ mensagem, tom = "sucesso" }: { mensagem: string; tom?: keyof typeof TOM }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={mensagem ? `mb-4 rounded-lg border px-4 py-2 text-sm ${TOM[tom]}` : "sr-only"}
    >
      {mensagem}
    </p>
  );
}
