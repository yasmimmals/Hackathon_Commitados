import { useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, LogOut, PlayCircle, Timer } from "lucide-react";
import {
  finalizarDescarga, iniciarDescarga,
  type Agendamento, type Descarga, type Equipamento,
} from "@/shared/services";
import { ROTULO_LOCAL } from "@/shared/utils/locais";

type Props = {
  agendamento: Agendamento;
  equipamentos: Equipamento[];
  executar: (acao: () => Promise<unknown>, sucesso: string) => Promise<void>;
  enviando: boolean;
};

const CLASSE_BOTAO =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const minutosEntre = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);

export default function EtapasDescarga({ agendamento: ag, equipamentos, executar, enviando }: Props) {
  const espera = ag.horario_chegada && ag.descargas.find((d) => d.horario_entrada)?.horario_entrada;

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      {ag.horario_chegada && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-700">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Chegou às {hora(ag.horario_chegada)}
          </span>
          {espera && <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" aria-hidden /> Espera de {minutosEntre(ag.horario_chegada, espera)} min</span>}
        </p>
      )}
      {ag.descargas.map((d) => (
        <EtapaDoArmazem key={d.id} ag={ag} descarga={d} equipamentos={equipamentos} executar={executar} enviando={enviando} />
      ))}
    </div>
  );
}

function EtapaDoArmazem({ ag, descarga: d, equipamentos, executar, enviando }: {
  ag: Agendamento; descarga: Descarga; equipamentos: Equipamento[];
  executar: Props["executar"]; enviando: boolean;
}) {
  const [chapas, setChapas] = useState(String(ag.chapas_norma ?? 0));
  const [usados, setUsados] = useState<string[]>([]);
  const [erro, setErro] = useState("");
  const nome = `${ROTULO_LOCAL[d.local]}${d.baia ? ` • ${d.baia.nome}` : ""}`;

  if (d.horario_saida && d.horario_entrada) {
    const nomes = d.equipamentos.map((e) => equipamentos.find((x) => x.codigo === e.codigo)?.nome ?? e.codigo);
    return (
      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
        <span className="font-semibold">{nome}:</span> descarga das {hora(d.horario_entrada)} às {hora(d.horario_saida)}
        {" "}({minutosEntre(d.horario_entrada, d.horario_saida)} min) • {d.qtd_chapas ?? 0} chapas
        {nomes.length > 0 && ` • ${nomes.join(", ")}`}
      </p>
    );
  }

  if (!d.horario_entrada) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2">
        <span className="text-xs font-semibold text-gray-700">{nome}: aguardando início</span>
        <button
          type="button"
          disabled={enviando}
          onClick={() => executar(() => iniciarDescarga(ag.id, d.local), `Descarga de #AG-${ag.id} iniciada em ${ROTULO_LOCAL[d.local]}.`)}
          className={`${CLASSE_BOTAO} bg-site-azul text-white hover:bg-site-azul-escuro focus-visible:ring-site-azul`}
        >
          {enviando ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <PlayCircle className="h-3.5 w-3.5" aria-hidden />}
          Iniciar descarregamento
        </button>
      </div>
    );
  }

  const registrarSaida = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const qtd = Number(chapas);
    if (!Number.isInteger(qtd) || qtd < 0) {
      setErro("Informe quantos chapas atuaram (número inteiro).");
      return;
    }
    setErro("");
    executar(
      () => finalizarDescarga(ag.id, { local: d.local, qtd_chapas: qtd, equipamentos: usados.map((codigo) => ({ codigo, qtd: 1 })) }),
      `Saída de #AG-${ag.id} registrada em ${ROTULO_LOCAL[d.local]}.`,
    );
  };

  return (
    <form noValidate onSubmit={registrarSaida} className="space-y-2 rounded-xl bg-sky-50 px-3 py-2">
      <p className="text-xs font-semibold text-site-azul">
        {nome}: descarregando desde {hora(d.horario_entrada)}
      </p>
      <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-start">
        <label className="text-xs font-semibold text-gray-700">
          Chapas que atuaram
          <input
            type="number" min={0} step={1} inputMode="numeric" value={chapas}
            onChange={(e) => setChapas(e.target.value)}
            aria-invalid={erro ? true : undefined}
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <fieldset>
          <legend className="text-xs font-semibold text-gray-700">Equipamentos usados</legend>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {equipamentos.map((eq) => (
              <label key={eq.codigo} className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={usados.includes(eq.codigo)}
                  onChange={(e) => setUsados((u) => (e.target.checked ? [...u, eq.codigo] : u.filter((c) => c !== eq.codigo)))}
                />
                {eq.nome}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      {erro && <p role="alert" className="text-xs text-red-700">{erro}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={enviando} className={`${CLASSE_BOTAO} bg-site-verde text-white hover:bg-site-verde-escuro focus-visible:ring-site-verde`}>
          {enviando ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <LogOut className="h-3.5 w-3.5" aria-hidden />}
          Caminhão saiu
        </button>
      </div>
    </form>
  );
}
