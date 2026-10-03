import { Navigation, Scale } from "lucide-react";
import { INSTRUCOES_MOTORISTAS } from "../../constants";
import Painel from "../Painel";

export default function InstrucoesMotoristas() {
  return (
    <Painel
      titulo={<><Navigation className="h-4 w-4 text-marca" aria-hidden /> Instruções para Motoristas em Trânsito</>}
      descricao="Orientações de tráfego e acondicionamento para frotas com destino aos armazéns COCAPEC."
    >
      <ul className="space-y-2">
        {INSTRUCOES_MOTORISTAS.map((i) => (
          <li key={i.titulo} className="flex gap-2 text-xs text-gray-600">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marca" aria-hidden />
            <p>
              <strong className="text-gray-800">{i.titulo}:</strong> {i.texto}
            </p>
          </li>
        ))}
      </ul>
      <footer className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
        <a href="tel:+551637110000" className="inline-flex items-center gap-1.5 font-semibold text-marca hover:underline">
          <Scale className="h-3.5 w-3.5" aria-hidden /> Contatar Balança Rodoviária
        </a>
        <span className="text-gray-500">Ramal: (16) 3711-0000</span>
      </footer>
    </Painel>
  );
}
