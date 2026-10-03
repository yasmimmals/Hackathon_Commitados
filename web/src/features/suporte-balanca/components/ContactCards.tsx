import type { ReactNode } from "react";
import { Clock, Mail, MessageCircle, Phone, Radio, RefreshCw, Scale, ShoppingCart, Truck } from "lucide-react";

function Card({ children }: { children: ReactNode }) {
  return <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">{children}</article>;
}

interface ContactCardsProps {
  filaAtualizadaEm: string;
  onAtualizarFila: () => void;
  onLigarGuarita: () => void;
}

export default function ContactCards({ filaAtualizadaEm, onAtualizarFila, onLigarGuarita }: ContactCardsProps) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <Card>
        <header className="mb-3 flex items-start justify-between gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-marca">
            <Scale className="h-5 w-5" aria-hidden />
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-marca ring-1 ring-emerald-200">
            ● Operando
          </span>
        </header>
        <h2 className="text-sm font-bold text-gray-900">Balança Rodoviária 01 &amp; 02</h2>
        <p className="mb-3 text-xs text-gray-500">Guarita Principal de Recepção e Triagem</p>
        <ul className="mb-4 space-y-2 text-xs text-gray-700">
          <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-marca" aria-hidden /> (16) 3711-6000 • Ramais 6204 / 6205</li>
          <li className="flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-marca" aria-hidden /> Rádio Portaria: Frequência VHF Canal 04</li>
          <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-marca" aria-hidden /> Seg a Sex: 07h00 às 18h00 • Sáb: 07h às 12h</li>
        </ul>
        <button
          type="button"
          onClick={onLigarGuarita}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-marca hover:bg-emerald-100"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden /> Ligar para Guarita
        </button>
      </Card>

      <Card>
        <header className="mb-3 flex items-start justify-between gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Truck className="h-5 w-5" aria-hidden />
          </span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
            Ao vivo
          </span>
        </header>
        <h2 className="text-sm font-bold text-gray-900">Fila da Balança Rodoviária</h2>
        <p className="mb-3 text-xs text-gray-500">Estimativa de fluxo e ocupação do pátio</p>
        <dl className="mb-2 space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <dt className="text-gray-700">Balança 01 (Entrada / Bruto)<br /><span className="text-gray-400">2 veículos em atendimento</span></dt>
            <dd className="text-right font-bold text-gray-900">~8 min<br /><span className="font-normal text-gray-400">tempo médio</span></dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <dt className="text-gray-700">Balança 02 (Saída / Tara)<br /><span className="text-gray-400">Sem fila de espera</span></dt>
            <dd className="text-right font-bold text-marca">Livre<br /><span className="font-normal text-gray-400">imediato</span></dd>
          </div>
        </dl>
        <p suppressHydrationWarning className="mb-4 text-[11px] text-gray-400">Atualizado às {filaAtualizadaEm}</p>
        <button
          type="button"
          onClick={onAtualizarFila}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Atualizar Status do Pátio
        </button>
      </Card>

      <Card>
        <header className="mb-3 flex items-start justify-between gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <ShoppingCart className="h-5 w-5" aria-hidden />
          </span>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
            Mesa de Compras
          </span>
        </header>
        <h2 className="text-sm font-bold text-gray-900">Compras &amp; Suprimentos</h2>
        <p className="mb-3 text-xs text-gray-500">Divergências contratuais, saldo e NF-e</p>
        <ul className="mb-3 space-y-2 text-xs text-gray-700">
          <li className="flex items-start gap-2">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden />
            <a href="mailto:compras.agro@cocapec.com.br" className="hover:underline">compras.agro@cocapec.com.br</a>
          </li>
          <li className="flex items-start gap-2">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden />
            <a href="mailto:notasfiscais@cocapec.com.br" className="hover:underline">notasfiscais@cocapec.com.br</a>
          </li>
        </ul>
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
          <strong>Plantão Fiscal:</strong> notas recusadas por divergência de pedido são analisadas em até 2h úteis.
        </p>
        <a
          href="https://wa.me/551637116000"
          target="_blank"
          rel="noreferrer"
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-marca px-3 py-2 text-xs font-semibold text-white hover:bg-marca-escuro"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden /> Falar com Comprador via WhatsApp
        </a>
      </Card>
    </div>
  );
}
