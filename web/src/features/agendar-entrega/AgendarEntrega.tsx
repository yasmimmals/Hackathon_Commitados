import { useState, type FormEvent } from "react";
import { focarPrimeiroErro, limparErros } from "@/shared/utils/formulario";
import AnexoNotaFiscal from "./components/AnexoNotaFiscal";
import ConfirmacaoAgendamento from "./components/ConfirmacaoAgendamento";
import DadosCarga from "./components/DadosCarga";
import EscolhaHorario from "./components/EscolhaHorario";
import PageHeader from "./components/PageHeader";
import PrevisaoChuvaAdubo from "./components/PrevisaoChuvaAdubo";
import ResumoAgendamento from "./components/ResumoAgendamento";
import { ENTREGA_VAZIA } from "./constants";
import { vagasNoHorario } from "./data/disponibilidadeMock";
import type { Categoria, EntregaConfirmada, ErrosEntrega, NovaEntrega } from "./types";
import { gerarProtocolo, validarEntrega, validarNotaFiscal } from "./utils/agendamento";

export default function AgendarEntrega() {
  const [entrega, setEntrega] = useState(ENTREGA_VAZIA);
  const [erros, setErros] = useState<ErrosEntrega>({});
  const [confirmada, setConfirmada] = useState<EntregaConfirmada | null>(null);

  const change = (patch: Partial<NovaEntrega>) => {
    setEntrega((e) => ({ ...e, ...patch }));
    setErros((errs) => limparErros(errs, patch));
  };

  // A ciência de chuva vale para a data escolhida; o horário só é mantido se tiver vaga na nova data.
  const escolherData = (data: string) => {
    const manterHorario = entrega.horario && data && vagasNoHorario(data, entrega.horario) > 0;
    change({ data, horario: manterHorario ? entrega.horario : "", cienteChuva: false });
  };

  const escolherCategoria = (categoria: Categoria) =>
    change({ categoria, cienteChuva: categoria === "adubo" && entrega.cienteChuva });

  const selecionarNotaFiscal = (arquivo: File | null) => {
    const erro = arquivo ? validarNotaFiscal(arquivo) : undefined;
    change({ notaFiscal: erro ? null : arquivo });
    if (erro) setErros((errs) => ({ ...errs, notaFiscal: erro }));
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const encontrados = validarEntrega(entrega);
    setErros(encontrados);
    if (focarPrimeiroErro(encontrados)) return;

    // TODO: enviar ao backend (multipart com a NF) quando a API de agendamentos existir.
    setConfirmada({ protocolo: gerarProtocolo(), entrega });
  };

  const novoAgendamento = () => {
    setEntrega(ENTREGA_VAZIA);
    setErros({});
    setConfirmada(null);
  };

  if (confirmada) return <ConfirmacaoAgendamento confirmada={confirmada} onNovo={novoAgendamento} />;

  const adubo = entrega.categoria === "adubo";

  return (
    <div>
      <PageHeader />
      <form noValidate onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-4">
          <EscolhaHorario
            data={entrega.data}
            horario={entrega.horario}
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
            erro={erros.notaFiscal}
            onSelecionar={selecionarNotaFiscal}
          />
        </div>
        <ResumoAgendamento entrega={entrega} />
      </form>
    </div>
  );
}
