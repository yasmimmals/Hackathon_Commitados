import { useEffect, useMemo, useState } from "react";
import { ClipboardList, FileSpreadsheet, FolderOpen, Lock, Truck } from "lucide-react";
import MensagemStatus from "@/shared/components/ui/MensagemStatus";
import { useMensagemTemporaria } from "@/shared/hooks/useMensagemTemporaria";
import { listarAgendamentos, type Agendamento, type LocalFisico } from "@/shared/services";
import { ROTULO_ACONDICIONAMENTO } from "@/shared/utils/acondicionamento";
import { dataLocalIso } from "@/shared/utils/janelas";
import { LOCAIS, ROTULO_LOCAL } from "@/shared/utils/locais";
import EquipeTemporaria from "./components/EquipeTemporaria";
import FechamentoBoletim from "./components/FechamentoBoletim";
import TabelaProducao from "./components/TabelaProducao";
import { lerBoletim, novoBoletim, salvarBoletim } from "./services/boletimStore";
import type { Boletim } from "./types";
import { calcularResumo, validarEquipe } from "./utils/calculo";
import { exportarBoletimExcel } from "./utils/exportar";

const formatarData = (iso: string) => iso.split("-").reverse().join("/");

/** Descargas concluídas no dia e armazém, para conferir a produção lançada. */
function DescargasDoDia({ data, local }: { data: string; local: LocalFisico }) {
  const [estado, setEstado] = useState<{ chave: string; lista?: Agendamento[]; erro?: boolean }>({ chave: "" });
  const chave = `${data}|${local}`;

  useEffect(() => {
    let ativo = true;
    listarAgendamentos({ data, status: "CONCLUIDO" }).then(
      (lista) => ativo && setEstado({ chave, lista: lista.filter((a) => a.descargas.some((d) => d.local === local)) }),
      () => ativo && setEstado({ chave, erro: true }),
    );
    return () => {
      ativo = false;
    };
  }, [chave, data, local]);

  const atual = estado.chave === chave ? estado : undefined;
  return (
    <section aria-labelledby="descargas-titulo" className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 id="descargas-titulo" className="titulo-secao mb-3 flex items-center gap-2 border-b-[3px] border-site-amarelo pb-2 text-lg">
        <Truck className="h-4 w-4" aria-hidden /> Descargas concluídas
      </h2>
      {!atual ? (
        <p role="status" className="text-sm text-gray-500">Consultando…</p>
      ) : atual.erro ? (
        <p className="text-sm text-gray-500">Não foi possível consultar as descargas (API indisponível).</p>
      ) : atual.lista!.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma descarga concluída neste armazém na data.</p>
      ) : (
        <ul className="divide-y divide-gray-100 text-sm">
          {atual.lista!.map((a) => (
            <li key={a.id} className="py-1.5">
              <span className="font-semibold text-gray-900">{a.fornecedor.nome}</span>
              <span className="block text-xs text-gray-500">
                #AG-{a.id} • NF-e {a.nf_numero ?? "—"} • {ROTULO_ACONDICIONAMENTO[a.acondicionamento]}
                {a.peso_kg && ` • ${(Number(a.peso_kg) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} t`}
                {a.descargas.find((d) => d.local === local)?.qtd_chapas != null &&
                  ` • ${a.descargas.find((d) => d.local === local)!.qtd_chapas} chapas`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function BoletimProducao() {
  // O boletim é fechado no dia seguinte: abre por padrão o de ontem.
  const [data, setData] = useState(() => dataLocalIso(-1));
  const [local, setLocal] = useState<LocalFisico>("INSUMOS");
  const [boletim, setBoletim] = useState<Boletim | null>(() => lerBoletim(dataLocalIso(-1), "INSUMOS"));
  const [feedback, setFeedback] = useMensagemTemporaria(6000);
  const [erro, setErro] = useState("");

  // Trocou data ou armazém: carrega o boletim correspondente.
  const chave = `${data}|${local}`;
  const [chaveCarregada, setChaveCarregada] = useState(chave);
  if (chave !== chaveCarregada) {
    setChaveCarregada(chave);
    setBoletim(lerBoletim(data, local));
    setErro("");
  }

  const salvar = (novo: Boletim) => {
    try {
      salvarBoletim(novo);
      setBoletim(novo);
      setErro("");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Falha ao salvar.");
    }
  };

  const resumo = useMemo(
    () => (boletim ? (boletim.status === "FECHADO" && boletim.resumo ? boletim.resumo : calcularResumo(boletim)) : null),
    [boletim],
  );

  const verificacoes = useMemo(() => {
    if (!boletim) return [];
    const outrosDoDia = LOCAIS.filter((l) => l !== local)
      .map((l) => lerBoletim(data, l))
      .filter((b): b is Boletim => b !== null);
    return validarEquipe(boletim, outrosDoDia);
  }, [boletim, data, local]);

  const fechar = () => {
    if (!boletim || !resumo) return;
    if (!window.confirm(`Fechar o boletim de ${formatarData(data)} (${ROTULO_LOCAL[local]})? Os totais serão congelados e não poderão mais ser alterados.`)) return;
    salvar({ ...boletim, status: "FECHADO", fechadoEm: new Date().toISOString(), resumo });
    setFeedback(`Boletim de ${formatarData(data)} fechado. Total a pagar congelado.`);
  };

  const bloqueado = boletim?.status === "FECHADO";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden /> Responsável pelo Armazém
          </p>
          <h1 className="titulo-pagina">Boletim de Produção</h1>
          <p className="mt-2 max-w-prose text-sm text-gray-600">
            Lance a produção do dia, confira a equipe temporária, valide os dados e feche o boletim com o cálculo de
            produção, piso e complemento.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-gray-700">
            Data
            <input
              type="date"
              value={data}
              max={dataLocalIso()}
              onChange={(e) => e.target.value && setData(e.target.value)}
              className="mt-1 block rounded-full border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Armazém
            <select
              value={local}
              onChange={(e) => setLocal(e.target.value as LocalFisico)}
              className="mt-1 block rounded-full border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {LOCAIS.map((l) => (
                <option key={l} value={l}>{ROTULO_LOCAL[l]}</option>
              ))}
            </select>
          </label>
          {boletim && resumo && (
            <button
              type="button"
              onClick={() => exportarBoletimExcel(boletim, resumo)}
              className="inline-flex items-center gap-2 rounded-full border border-site-verde bg-white px-4 py-2 text-sm font-semibold text-marca hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden /> Exportar para Excel
            </button>
          )}
        </div>
      </div>

      <MensagemStatus mensagem={feedback} />
      <MensagemStatus mensagem={erro} tom="erro" />

      {!boletim ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-4 py-12 text-center shadow-sm">
          <FolderOpen className="h-8 w-8 text-gray-300" aria-hidden />
          <p className="font-semibold text-gray-800">
            Ainda não há boletim de {formatarData(data)} para {ROTULO_LOCAL[local]}.
          </p>
          <button
            type="button"
            onClick={() => salvar(novoBoletim(data, local))}
            className="inline-flex items-center gap-2 rounded-full bg-site-verde px-6 py-3 text-sm font-bold text-white hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2"
          >
            <FolderOpen className="h-4 w-4" aria-hidden /> Abrir boletim de {formatarData(data)}
          </button>
        </div>
      ) : (
        resumo && (
          <>
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                  bloqueado ? "bg-gray-100 text-gray-700 ring-gray-200" : "bg-amber-50 text-amber-800 ring-amber-200"
                }`}
              >
                {bloqueado && <Lock className="h-3 w-3" aria-hidden />} {bloqueado ? "Fechado" : "Rascunho • salvo automaticamente"}
              </span>
              <span className="text-gray-600">
                {ROTULO_LOCAL[local]} • {formatarData(data)}
              </span>
            </p>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
              <div className="space-y-6">
                <TabelaProducao
                  boletim={boletim}
                  bloqueado={bloqueado}
                  producaoTotal={resumo.producaoTotal}
                  onChange={(tipoId, linha) => salvar({ ...boletim, producoes: { ...boletim.producoes, [tipoId]: linha } })}
                />
                <EquipeTemporaria chapas={boletim.chapas} bloqueado={bloqueado} onChange={(chapas) => salvar({ ...boletim, chapas })} />
                <label className="block rounded-3xl bg-white p-5 text-sm font-semibold text-gray-700 shadow-sm">
                  Observação
                  <textarea
                    rows={2}
                    value={boletim.observacao}
                    disabled={bloqueado}
                    onChange={(e) => salvar({ ...boletim, observacao: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 font-normal disabled:bg-gray-50"
                  />
                </label>
              </div>
              <div className="space-y-6 xl:sticky xl:top-4">
                <FechamentoBoletim boletim={boletim} resumo={resumo} verificacoes={verificacoes} onFechar={fechar} />
                <DescargasDoDia data={data} local={local} />
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
