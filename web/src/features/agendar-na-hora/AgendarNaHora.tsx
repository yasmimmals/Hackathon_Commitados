import { useRef, useState } from "react";
import { validarNotaFiscal } from "@/features/agendar-entrega/utils/agendamento";
import MensagemStatus from "@/shared/components/ui/MensagemStatus";
import { useMensagemTemporaria } from "@/shared/hooks/useMensagemTemporaria";
import { agendarBalcao, enviarNotaFiscal, ErroApi, mensagemDeErro } from "@/shared/services";
import { ACONDICIONAMENTO_API } from "@/shared/utils/acondicionamento";
import { focarPrimeiroErro, limparErros } from "@/shared/utils/formulario";
import PageHeader from "./components/PageHeader";
import WarehouseAvailability from "./components/WarehouseAvailability";
import YardEntryForm from "./components/YardEntryForm";
import { ARMAZENS_MOCK, ENTRADA_VAZIA } from "./data/armazensMock";
import type { Packaging, WarehouseId, YardEntry, YardEntryErrors } from "./types";
import { janelaAtual, validarEntrada } from "./utils/entradaPatio";

export default function AgendarNaHora() {
  const [warehouses, setWarehouses] = useState(ARMAZENS_MOCK);
  const [entry, setEntry] = useState(ENTRADA_VAZIA);
  const [errors, setErrors] = useState<YardEntryErrors>({});
  const [feedback, setFeedback] = useMensagemTemporaria();
  const [erroEnvio, setErroEnvio] = useMensagemTemporaria(10000);
  const [lendoNota, setLendoNota] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // Arquivo da leitura em andamento: respostas de um arquivo já trocado são ignoradas.
  const arquivoEmLeitura = useRef<File | null>(null);

  const change = (patch: Partial<YardEntry>) => {
    setEntry((e) => ({ ...e, ...patch }));
    setErrors((errs) => limparErros(errs, patch));
  };

  // Ao trocar de armazém, mantém o acondicionamento se ele for aceito; senão usa o primeiro aceito.
  const selectWarehouse = (id: WarehouseId) => {
    const w = warehouses.find((x) => x.id === id);
    if (!w || w.slots === 0) return;
    change({ warehouse: id, packaging: w.accepts.includes(entry.packaging) ? entry.packaging : w.accepts[0] });
  };

  // Ao trocar o acondicionamento, migra para um armazém com vaga que o aceite, se necessário.
  const selectPackaging = (key: Packaging) => {
    const current = warehouses.find((x) => x.id === entry.warehouse);
    const target = current?.accepts.includes(key)
      ? current
      : warehouses.find((x) => x.slots > 0 && x.accepts.includes(key));
    if (target) change({ packaging: key, warehouse: target.id });
  };

  // A NF é lida pelo backend assim que anexada: o encaixe usa o id dela.
  const selectNota = (arquivo: File | null) => {
    const erro = arquivo ? validarNotaFiscal(arquivo) : undefined;
    change({ notaFiscal: null });
    arquivoEmLeitura.current = erro ? null : arquivo;
    setLendoNota(!erro && !!arquivo);
    if (erro) setErrors((errs) => ({ ...errs, notaFiscal: erro }));
    if (erro || !arquivo) return;

    enviarNotaFiscal(arquivo).then(
      (nota) => {
        if (arquivoEmLeitura.current !== arquivo) return;
        setLendoNota(false);
        change({ notaFiscal: nota });
        if (nota.alertas.length) setFeedback(`Nota lida com alertas: ${nota.alertas.join(" ")}`);
      },
      (falha) => {
        if (arquivoEmLeitura.current !== arquivo) return;
        setLendoNota(false);
        setErrors((errs) => ({ ...errs, notaFiscal: mensagemDeErro(falha) }));
      },
    );
  };

  const submit = async () => {
    if (enviando) return;
    const found = validarEntrada(entry);
    if (!found.notaFiscal && lendoNota) found.notaFiscal = "Aguarde a leitura da nota fiscal.";
    setErrors(found);
    setErroEnvio("");
    if (focarPrimeiroErro(found) || !entry.notaFiscal) return;

    const w = warehouses.find((x) => x.id === entry.warehouse)!;
    if (w.slots === 0) {
      setErroEnvio(`O armazém ${w.name} ficou sem vagas. Escolha outro armazém.`);
      return;
    }
    const horario = janelaAtual();
    if (!horario) {
      setErroEnvio("O recebimento de hoje já foi encerrado. Agende a entrega para outro dia.");
      return;
    }

    setEnviando(true);
    try {
      const agendamento = await agendarBalcao({
        nota_fiscal_id: entry.notaFiscal.id,
        horario,
        acondicionamento: ACONDICIONAMENTO_API[entry.packaging],
      });
      setWarehouses((list) => list.map((x) => (x.id === w.id ? { ...x, slots: x.slots - 1 } : x)));
      setFeedback(
        `Veículo ${entry.plate} registrado no encaixe #AG-${agendamento.id} (janela das ${horario}h, ${w.name} – ${w.dock}). ` +
          `Aguardando validação da Mesa de Compras; o motorista será chamado no WhatsApp ${entry.whatsapp}.`,
      );

      // Prepara o próximo encaixe já apontando para um armazém que ainda tenha vaga.
      const nextWarehouse = w.slots - 1 > 0 ? w : warehouses.find((x) => x.id !== w.id && x.slots > 0);
      arquivoEmLeitura.current = null;
      setEntry({
        ...ENTRADA_VAZIA,
        warehouse: nextWarehouse?.id ?? w.id,
        packaging: nextWarehouse?.accepts[0] ?? ENTRADA_VAZIA.packaging,
      });
    } catch (falha) {
      const mensagem = mensagemDeErro(falha);
      if (falha instanceof ErroApi && falha.codigo.startsWith("NOTA_")) {
        setErrors({ notaFiscal: mensagem });
        focarPrimeiroErro({ notaFiscal: mensagem });
      } else {
        // SEM_VAGA_BALCAO: o backend já registrou o não recebimento (número na mensagem).
        setErroEnvio(mensagem);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <PageHeader />
      <MensagemStatus mensagem={feedback} />
      <MensagemStatus mensagem={erroEnvio} tom="erro" />
      <WarehouseAvailability warehouses={warehouses} selected={entry.warehouse} onSelect={selectWarehouse} />
      <YardEntryForm
        value={entry}
        errors={errors}
        warehouses={warehouses}
        lendoNota={lendoNota}
        enviando={enviando}
        onSelectNota={selectNota}
        onChange={change}
        onSelectWarehouse={selectWarehouse}
        onSelectPackaging={selectPackaging}
        onReceipt={() => setFeedback("\"Comprovante de não recebimento\" estará disponível em breve.")}
        onSubmit={submit}
      />
    </div>
  );
}
