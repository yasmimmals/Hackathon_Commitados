import { Clock, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-10 print:hidden border-t-4 border-site-amarelo bg-site-azul text-sky-50">
      <div className="mx-auto grid max-w-[1300px] gap-8 px-4 py-8 md:grid-cols-3">
        <div>
          <p className="text-2xl font-black italic tracking-tight text-white">COCAPEC</p>
          <p className="text-xs font-semibold italic text-site-amarelo">O melhor café está aqui</p>
          <p className="mt-2 text-xs font-semibold">Cooperativa de Cafeicultores e Agropecuaristas</p>
          <p className="mt-1 text-xs text-sky-100/80">Terminal e Armazém Geral Franca/SP • Polo Cafeeiro Alta Mogiana</p>
        </div>

        <div>
          <h2 className="mb-3 w-fit border-b-2 border-site-amarelo pb-0.5 text-xs font-bold uppercase tracking-wide text-white">Central de Apoio ao Fornecedor</h2>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="tel:+551637116000" className="inline-flex items-center gap-2 hover:text-white hover:underline">
                <Phone className="h-3.5 w-3.5" aria-hidden /> Balança &amp; Portaria: (16) 3711-6000 | Ramal 6204
              </a>
            </li>
            <li>
              <a href="mailto:agendamento.cargas@cocapec.com.br" className="inline-flex items-center gap-2 hover:text-white hover:underline">
                <Mail className="h-3.5 w-3.5" aria-hidden /> agendamento.cargas@cocapec.com.br
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 w-fit border-b-2 border-site-amarelo pb-0.5 text-xs font-bold uppercase tracking-wide text-white">Horário de Recebimento de Cargas</h2>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" aria-hidden /> Segunda a Sexta-feira: 08h00 às 17h00
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> Rodovia Cândido Portinari, Km 398 - Franca/SP
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1300px] flex-col gap-1 px-4 py-3 text-[11px] text-sky-100/70 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} COCAPEC - Cooperativa de Cafeicultores e Agropecuaristas. Todos os direitos reservados.</span>
          <span>Portal Integrado de Logística de Grãos e Insumos</span>
        </div>
      </div>
    </footer>
  );
}
