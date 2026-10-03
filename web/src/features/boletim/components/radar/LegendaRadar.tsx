const faixas = [
  { cor: "bg-red-500", rotulo: "50+ Tempestade" },
  { cor: "bg-amber-500", rotulo: "35–50 Moderada" },
  { cor: "bg-green-500", rotulo: "20–35 Fraca" },
];

export default function LegendaRadar() {
  return (
    <div className="absolute right-3 top-3 rounded-md bg-black/60 p-2 text-[10px] text-gray-200">
      <p className="mb-1 font-semibold">Intensidade (dBZ)</p>
      {faixas.map((f) => (
        <p key={f.rotulo} className="flex items-center gap-1">
          <span className={`h-2 w-3 rounded-sm ${f.cor}`} aria-hidden /> {f.rotulo}
        </p>
      ))}
    </div>
  );
}
