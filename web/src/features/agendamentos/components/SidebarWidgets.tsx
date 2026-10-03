import { Phone } from "lucide-react";
import PrevisaoTempoResumo from "@/features/boletim/components/previsao/PrevisaoTempoResumo";

const scales = [
  { name: "Balança 01", vehicles: 2 },
  { name: "Balança 02", vehicles: 1 },
];

export default function SidebarWidgets() {
  return (
    <aside className="space-y-4">
      <PrevisaoTempoResumo hrefBoletim="/fornecedor/previsao" />

      <section aria-labelledby="fila-balanca-titulo" className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 id="fila-balanca-titulo" className="titulo-secao mb-3 border-b-[3px] border-site-amarelo pb-2 text-lg">
          Fila na Balança Franca
        </h2>
        <ul className="space-y-2">
          {scales.map(({ name, vehicles }) => (
            <li key={name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
              <span className="text-gray-700">{name}</span>
              <span className="font-semibold text-site-azul">
                {vehicles} {vehicles === 1 ? "veículo" : "veículos"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>Balança &amp; Portaria</span>
          <a href="tel:+551637116000" className="inline-flex items-center gap-1 font-medium text-gray-700 hover:text-marca">
            <Phone className="h-3.5 w-3.5" aria-hidden /> (16) 3711-6000
          </a>
        </div>
      </section>
    </aside>
  );
}
