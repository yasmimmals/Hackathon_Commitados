import { useRef, useState, type FormEvent } from "react";
import {
  criarAgendamento, enviarNotaFiscal, ErroApi, mensagemDeErro, type NotaFiscal,
} from "@/shared/services";
import { ACONDICIONAMENTO_API } from "@/shared/utils/acondicionamento";
import { focarPrimeiroErro, limparErros } from "@/shared/utils/formulario";
import AnexoNotaFiscal from "./components/AnexoNotaFiscal";
import ConfirmacaoAgendamento from "./components/ConfirmacaoAgendamento";
import DadosCarga from "./components/DadosCarga";
import EscolhaHorario from "./components/EscolhaHorario";
import PageHeader from "./components/PageHeader";
import PrevisaoChuvaAdubo from "./components/PrevisaoChuvaAdubo";
import ResumoAgendamento from "./components/ResumoAgendamento";
import { ENTREGA_VAZIA } from "./constants";
import { useDisponibilidade } from "./hooks/useDisponibilidade";
import type { Acondicionamento, Categoria, EntregaConfirmada, ErrosEntrega, Horario, NovaEntrega } from "./types";
import { pesoDaNota, validarEntrega, validarNotaFiscal, vagasNoHorario } from "./utils/agendamento";

const CAMPO_DA_RECUSA: Partial<Record<string, keyof NovaEntrega>> = {
  DIA_NAO_UTIL: "data",
  CHUVA_BLOQUEADA: "data",
  HORARIO_PASSADO: "horario",
  VAGA_OCUPADA: "horario",
  EXIGE_CIENCIA_CHUVA: "cienteChuva",
  NOTA_INVALIDA: "notaFiscal",
  NOTA_JA_AGENDADA: "notaFiscal",
};

export default function AgendarEntrega() {
  const [entrega, setEntrega] = useState(ENTREGA_VAZIA);
  const [erros, setErros] = useState<ErrosEntrega>({});
  const [confirmada, setConfirmada] = useState<EntregaConfirmada | null>(null);
  const [nota, setNota] = useState<NotaFiscal | null>(null);
  const [lendoNota, setLendoNota] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const arquivoEmLeitura = useRef<File | null>(null);

  const disponibilidade = useDisponibilidade(entrega.data, nota?.id);
  const vagas = (horario: Horario) =>
    vagasNoHorario(disponibilidade.slots, entrega.data, horario, entrega.acondicionamento);

  const change = (patch: Partial<NovaEntrega>) => {
    setEntrega((e) => ({ ...e, ...patch }));
    setErros((errs) => limparErros(errs, patch));
    setErroEnvio("");
  };

  const escolherData = (data: string) => change({ data, horario: "", cienteChuva: false });

  const escolherCategoria = (categoria: Categoria) =>
    change({ categoria, cienteChuva: categoria === "adubo" && entrega.cienteChuva });

  const selecionarNotaFiscal = (arquivo: File | null) => {
    const erro = arquivo ? validarNotaFiscal(arquivo) : undefined;
    change({ notaFiscal: erro ? null : arquivo });
    setNota(null);
    arquivoEmLeitura.current = erro ? null : arquivo;
    setLendoNota(!erro && !!arquivo);
    if (erro) setErros((errs) => ({ ...errs, notaFiscal: erro }));
    if (erro || !arquivo) return;

    enviarNotaFiscal(arquivo).then(
      (lida) => {
        if (arquivoEmLeitura.current !== arquivo) return;
        setNota(lida);
        setLendoNota(false);
        const pesoKg = lida.peso_liquido_kg ?? lida.peso_bruto_kg;
        setEntrega((e) => ({
          ...e,
          peso: e.peso || (pesoKg ? pesoDaNota(pesoKg) : ""),
          categoria: lida.carga_adubo ? "adubo" : e.categoria,
        }));
      },
      (falha) => {
        if (arquivoEmLeitura.current !== arquivo) return;
        setLendoNota(false);
        setEntrega((e) => ({ ...e, notaFiscal: null }));
        setErros((errs) => ({ ...errs, notaFiscal: mensagemDeErro(falha) }));
      },
    );
  };

  const tratarRecusa = (falha: unknown) => {
    const mensagem = mensagemDeErro(falha);
    const campo = falha instanceof ErroApi ? CAMPO_DA_RECUSA[falha.codigo] : undefined;
    if (!campo) {
      setErroEnvio(mensagem);
      return;
    }
    if (campo === "cienteChuva") setEntrega((e) => ({ ...e, categoria: "adubo" }));
    const novos: ErrosEntrega = { [campo]: mensagem };
    setErros(novos);
    requestAnimationFrame(() => focarPrimeiroErro(novos));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enviando) return;

    const vagasConhecidas = !disponibilidade.carregando && !disponibilidade.erro;
    const encontrados = validarEntrega(entrega, vagasConhecidas ? vagas : undefined);
    if (!encontrados.notaFiscal && !nota) {
      encontrados.notaFiscal = lendoNota ? "Aguarde a leitura da nota fiscal." : "Anexe a nota fiscal novamente.";
    }
    setErros(encontrados);
    setErroEnvio("");
    if (focarPrimeiroErro(encontrados) || !nota) return;

    setEnviando(true);
    try {
      const agendamento = await criarAgendamento({
        nota_fiscal_id: nota.id,
        data: entrega.data,
        horario: entrega.horario as Horario,
        acondicionamento: ACONDICIONAMENTO_API[entrega.acondicionamento as Acondicionamento],
        ciente_risco_chuva: entrega.cienteChuva,
      });
      setConfirmada({ protocolo: `#AG-${agendamento.id}`, entrega });
    } catch (falha) {
      tratarRecusa(falha);
    } finally {
      setEnviando(false);
    }
  };

  const novoAgendamento = () => {
    setEntrega(ENTREGA_VAZIA);
    setErros({});
    setConfirmada(null);
    setNota(null);
    setLendoNota(false);
    setErroEnvio("");
    arquivoEmLeitura.current = null;
  };

  if (confirmada) return <ConfirmacaoAgendamento confirmada={confirmada} onNovo={novoAgendamento} />;

  const adubo = entrega.categoria === "adubo";

  return (
    <div>
      <PageHeader />
      <form noValidate onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-4">
          <EscolhaHorario
            data={entrega.data}
            horario={entrega.horario}
            acondicionamento={entrega.acondicionamento}
            disponibilidade={disponibilidade}
            erros={erros}
            onData={escolherData}
            onHorario={(horario) => change({ horario })}
          />
          <DadosCarga value={entrega} erros={erros} onCategoria={escolherCategoria} onChange={change} />
          {adubo && (
            <PrevisaoChuvaAdubo
              numero={3}
              data={entrega.data}
              ciente={entrega.cienteChuva}
              erro={erros.cienteChuva}
              onEscolherData={escolherData}
              onCiente={(cienteChuva) => change({ cienteChuva })}
            />
          )}
          <AnexoNotaFiscal
            numero={adubo ? 4 : 3}
            arquivo={entrega.notaFiscal}
            nota={nota}
            lendo={lendoNota}
            erro={erros.notaFiscal}
            onSelecionar={selecionarNotaFiscal}
          />
        </div>
        <ResumoAgendamento entrega={entrega} enviando={enviando} erroEnvio={erroEnvio} />
      </form>
    </div>
  );
}
