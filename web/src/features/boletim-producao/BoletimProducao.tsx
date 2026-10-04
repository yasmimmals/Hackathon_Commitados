import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, FileSpreadsheet, FolderOpen, LoaderCircle, Lock, ServerCrash, Truck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import MensagemStatus from "@/shared/components/ui/MensagemStatus";
import { useMensagemTemporaria } from "@/shared/hooks/useMensagemTemporaria";
import {
  abrirBoletim, buscarBoletim, criarChapa, definirEquipe, ErroApi, fecharBoletim, lancarProducao,
  listarAgendamentos, listarBoletins, listarChapas, listarTiposItem, mensagemDeErro, reabrirBoletim,
  type Agendamento, type Boletim, type Chapa, type ChapaNoBoletimIn, type TipoItem,
} from "@/shared/services";
import { ROTULO_ACONDICIONAMENTO } from "@/shared/utils/acondicionamento";
import { dataBr } from "@/shared/utils/formatacao";
import { dataLocalIso } from "@/shared/utils/janelas";
import { ROTULO_LOCAL } from "@/shared/utils/locais";
import EquipeTemporaria from "./components/EquipeTemporaria";
import FechamentoBoletim from "./components/FechamentoBoletim";
import TabelaProducao, { type Rascunho } from "./components/TabelaProducao";
import { verificarBoletim } from "./utils/boletim";
import { exportarBoletimExcel } from "./utils/exportar";

type Dados = { boletim: Boletim | null; tipos: TipoItem[]; chapas: Chapa[] };
type Carga = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "ok"; dados: Dados };

const rascunhoDe = (b: Boletim | null): Rascunho =>
  Object.fromEntries(
    (b?.linhas ?? []).map((l) => [
      l.tipo_item_id,
      { tipo_item_id: l.tipo_item_id, descarga: l.descarga, remocao: l.remocao, transferencia: l.transferencia },
    ]),
  );

/** Descargas concluídas no dia (todos os armazéns), para conferir a produção lançada. */
function DescargasDoDia({ data }: { data: string }) {
  const [estado, setEstado] = useState<{ data: string; lista?: Agendamento[]; erro?: boolean }>({ data: "" });

  useEffect(() => {
    let ativo = true;
    listarAgendamentos({ data, status: "CONCLUIDO" }).then(
      (lista) => ativo && setEstado({ data, lista }),
      () => ativo && setEstado({ data, erro: true }),
    );
    return () => {
      ativo = false;
    };
  }, [data]);

  const atual = estado.data === data ? estado : undefined;
  return (
    <section aria-labelledby="descargas-titulo" className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 id="descargas-titulo" className="titulo-secao mb-3 flex items-center gap-2 border-b-[3px] border-site-amarelo pb-2 text-lg">
        <Truck className="h-4 w-4" aria-hidden /> Descargas concluídas
      </h2>
      {!atual ? (
        <p role="status" className="text-sm text-gray-500">Consultando…</p>
      ) : atual.erro ? (
        <p className="text-sm text-gray-500">Não foi possível consultar as descargas.</p>
      ) : atual.lista!.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma descarga concluída nesta data.</p>
      ) : (
        <ul className="divide-y divide-gray-100 text-sm">
          {atual.lista!.map((a) => (
            <li key={a.id} className="py-1.5">
              <span className="font-semibold text-gray-900">{a.fornecedor.nome}</span>
              <span className="block text-xs text-gray-500">
                #AG-{a.id} • NF-e {a.nf_numero ?? "—"} • {ROTULO_ACONDICIONAMENTO[a.acondicionamento]}
                {a.descargas.length > 0 && ` • ${a.descargas.map((d) => ROTULO_LOCAL[d.local]).join(" + ")}`}
                {a.descargas.some((d) => d.qtd_chapas != null) &&
                  ` • ${a.descargas.reduce((t, d) => t + (d.qtd_chapas ?? 0), 0)} chapas`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function BoletimProducao() {
  const { usuario } = useAuth();
  // O boletim é fechado no dia seguinte: abre por padrão o de ontem.
  const [data, setData] = useState(() => dataLocalIso(-1));
  const [carga, setCarga] = useState<Carga>({ tipo: "carregando" });
  const [rascunho, setRascunho] = useState<Rascunho>({});
  const [alterado, setAlterado] = useState(false);
  const [ocupado, setOcupado] = useState<"" | "abrir" | "producao" | "equipe" | "fechamento">("");
  const [feedback, setFeedback] = useMensagemTemporaria(6000);
  const [erro, setErro] = useMensagemTemporaria(10000);

  const carregar = useCallback(() => {
    let ativo = true;
    Promise.all([listarBoletins({ inicio: data, fim: data }), listarTiposItem(), listarChapas()]).then(
      ([boletins, tipos, chapas]) => {
        if (!ativo) return;
        // Padrão da Cocapec: um boletim geral por dia (sem armazém).
        const boletim = boletins.find((b) => b.local === null) ?? boletins[0] ?? null;
        setCarga({ tipo: "ok", dados: { boletim, tipos: tipos.filter((t) => t.ativo), chapas } });
        setRascunho(rascunhoDe(boletim));
        setAlterado(false);
      },
      (falha) => ativo && setCarga({ tipo: "erro", mensagem: mensagemDeErro(falha) }),
    );
    return () => {
      ativo = false;
    };
  }, [data]);

  useEffect(carregar, [carregar]);

  const dados = carga.tipo === "ok" ? carga.dados : undefined;
  const boletim = dados?.boletim ?? null;

  /** Atualiza o boletim vindo da API; a produção em edição só é trocada quando pedido. */
  const aplicar = (b: Boletim, { reiniciarRascunho }: { reiniciarRascunho: boolean }) => {
    setCarga((c) => (c.tipo === "ok" ? { tipo: "ok", dados: { ...c.dados, boletim: b } } : c));
    if (reiniciarRascunho) {
      setRascunho(rascunhoDe(b));
      setAlterado(false);
    }
  };

  const executar = async <T,>(etapa: typeof ocupado, acao: () => Promise<T>): Promise<T | undefined> => {
    setOcupado(etapa);
    setErro("");
    try {
      return await acao();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      return undefined;
    } finally {
      setOcupado("");
    }
  };

  const abrir = () =>
    executar("abrir", async () => {
      try {
        aplicar(await abrirBoletim({ data }), { reiniciarRascunho: true });
      } catch (falha) {
        // Outra pessoa abriu o boletim do dia: carrega o existente.
        if (falha instanceof ErroApi && falha.codigo === "BOLETIM_JA_EXISTE") {
          aplicar(await buscarBoletim(Number(falha.detalhes.boletim_id)), { reiniciarRascunho: true });
        } else throw falha;
      }
      setFeedback(`Boletim de ${dataBr(data)} aberto.`);
    });

  const salvarProducao = () =>
    boletim &&
    executar("producao", async () => {
      const linhas = Object.values(rascunho).filter((l) => l.descarga + l.remocao + l.transferencia > 0);
      aplicar(await lancarProducao(boletim.id, linhas), { reiniciarRascunho: true });
      setFeedback("Produção salva.");
    });

  const salvarEquipe = async (equipe: ChapaNoBoletimIn[]) =>
    !!boletim &&
    (await executar("equipe", async () => {
      aplicar(await definirEquipe(boletim.id, equipe), { reiniciarRascunho: false });
      return true;
    })) === true;

  const cadastrarChapa = async (matricula: string, nome: string) =>
    (await executar("equipe", async () => {
      const novo = await criarChapa({ matricula, nome });
      setCarga((c) => (c.tipo === "ok" ? { tipo: "ok", dados: { ...c.dados, chapas: [...c.dados.chapas, novo] } } : c));
      setFeedback(`Chapa ${novo.matricula} cadastrado.`);
      return true;
    })) === true;

  const fechar = () => {
    if (!boletim) return;
    if (!window.confirm(`Fechar o boletim de ${dataBr(data)}? Os valores serão congelados (dá para reabrir depois).`)) return;
    executar("fechamento", async () => {
      aplicar(await fecharBoletim(boletim.id, usuario?.nome ?? "Responsável pelo armazém"), { reiniciarRascunho: true });
      setFeedback(`Boletim de ${dataBr(data)} fechado. Total a pagar congelado.`);
    });
  };

  const reabrir = () => {
    if (!boletim) return;
    if (!window.confirm("Reabrir o boletim? Ele volta a rascunho e os totais podem mudar.")) return;
    executar("fechamento", async () => {
      aplicar(await reabrirBoletim(boletim.id), { reiniciarRascunho: true });
      setFeedback("Boletim reaberto para correção.");
    });
  };

  const verificacoes = useMemo(() => (boletim && dados ? verificarBoletim(boletim, dados.chapas) : []), [boletim, dados]);
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
              onChange={(e) => {
                if (!e.target.value) return;
                if (alterado && !window.confirm("Há produção não salva. Trocar de data e descartar?")) return;
                setData(e.target.value);
                setCarga({ tipo: "carregando" });
              }}
              className="mt-1 block rounded-full border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          {boletim && (
            <button
              type="button"
              onClick={() => exportarBoletimExcel(boletim)}
              className="inline-flex items-center gap-2 rounded-full border border-site-verde bg-white px-4 py-2 text-sm font-semibold text-marca hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden /> Exportar para Excel
            </button>
          )}
        </div>
      </div>

      <MensagemStatus mensagem={feedback} />
      <MensagemStatus mensagem={erro} tom="erro" />

      {carga.tipo === "carregando" && (
        <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Carregando o boletim…
        </p>
      )}

      {carga.tipo === "erro" && (
        <div role="alert" className="flex flex-col items-center gap-2 rounded-3xl bg-white px-4 py-10 text-center shadow-sm">
          <ServerCrash className="h-6 w-6 text-gray-400" aria-hidden />
          <p className="text-sm text-gray-700">Não foi possível carregar o boletim.</p>
          <p className="text-xs text-gray-500">{carga.mensagem}</p>
          <button
            type="button"
            onClick={() => {
              setCarga({ tipo: "carregando" });
              carregar();
            }}
            className="mt-1 text-sm font-semibold text-marca hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {dados && !boletim && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-4 py-12 text-center shadow-sm">
          <FolderOpen className="h-8 w-8 text-gray-300" aria-hidden />
          <p className="font-semibold text-gray-800">Ainda não há boletim de {dataBr(data)}.</p>
          <button
            type="button"
            onClick={abrir}
            disabled={ocupado === "abrir"}
            className="inline-flex items-center gap-2 rounded-full bg-site-verde px-6 py-3 text-sm font-bold text-white hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {ocupado === "abrir" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <FolderOpen className="h-4 w-4" aria-hidden />}
            Abrir boletim de {dataBr(data)}
          </button>
        </div>
      )}

      {dados && boletim && (
        <>
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                bloqueado ? "bg-gray-100 text-gray-700 ring-gray-200" : "bg-amber-50 text-amber-800 ring-amber-200"
              }`}
            >
              {bloqueado && <Lock className="h-3 w-3" aria-hidden />} {bloqueado ? "Fechado" : "Rascunho"}
            </span>
            <span className="text-gray-600">
              Boletim #{boletim.id} • {boletim.local ? ROTULO_LOCAL[boletim.local] : "Geral (Franca)"} • {dataBr(boletim.data)}
            </span>
          </p>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
            <div className="space-y-6">
              <TabelaProducao
                tipos={dados.tipos}
                rascunho={rascunho}
                bloqueado={bloqueado}
                alterado={alterado}
                salvando={ocupado === "producao"}
                onChange={(linha) => {
                  setRascunho((r) => ({ ...r, [linha.tipo_item_id]: linha }));
                  setAlterado(true);
                }}
                onSalvar={salvarProducao}
              />
              <EquipeTemporaria
                equipe={boletim.equipe}
                chapas={dados.chapas}
                bloqueado={bloqueado}
                salvando={ocupado === "equipe"}
                onSalvar={salvarEquipe}
                onCadastrarChapa={cadastrarChapa}
              />
            </div>
            <div className="space-y-6 xl:sticky xl:top-4">
              <FechamentoBoletim
                boletim={boletim}
                verificacoes={verificacoes}
                producaoPendente={alterado}
                enviando={ocupado === "fechamento"}
                onFechar={fechar}
                onReabrir={reabrir}
              />
              <DescargasDoDia data={data} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
