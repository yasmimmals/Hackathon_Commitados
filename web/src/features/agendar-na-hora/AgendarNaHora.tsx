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

const escaparHtml = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export default function AgendarNaHora() {
  const [warehouses, setWarehouses] = useState(ARMAZENS_MOCK);
  const [entry, setEntry] = useState(ENTRADA_VAZIA);
  const [errors, setErrors] = useState<YardEntryErrors>({});
  const [feedback, setFeedback] = useMensagemTemporaria();
  const [erroEnvio, setErroEnvio] = useMensagemTemporaria(10000);
  const [lendoNota, setLendoNota] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [naoRecebimento, setNaoRecebimento] = useState<{
    id: number;
    motivo: string;
    em: Date;
    nota: YardEntry["notaFiscal"];
    placa: string;
    motorista: string;
  } | null>(null);
  const arquivoEmLeitura = useRef<File | null>(null);

  const change = (patch: Partial<YardEntry>) => {
    setEntry((e) => ({ ...e, ...patch }));
    setErrors((errs) => limparErros(errs, patch));
  };

  const selectWarehouse = (id: WarehouseId) => {
    const w = warehouses.find((x) => x.id === id);
    if (!w || w.slots === 0) return;
    change({ warehouse: id, packaging: w.accepts.includes(entry.packaging) ? entry.packaging : w.accepts[0] });
  };

  const selectPackaging = (key: Packaging) => {
    const current = warehouses.find((x) => x.id === entry.warehouse);
    const target = current?.accepts.includes(key)
      ? current
      : warehouses.find((x) => x.slots > 0 && x.accepts.includes(key));
    if (target) change({ packaging: key, warehouse: target.id });
  };

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
        if (falha instanceof ErroApi && falha.codigo === "SEM_VAGA_BALCAO") {
          setNaoRecebimento({
            id: Number(falha.detalhes.nao_recebimento_id),
            motivo: mensagem,
            em: new Date(),
            nota: entry.notaFiscal,
            placa: entry.plate,
            motorista: entry.driver,
          });
        }
        setErroEnvio(mensagem);
      }
    } finally {
      setEnviando(false);
    }
  };

  const emitirComprovante = () => {
    if (!naoRecebimento) {
      setErroEnvio("Não há recusa registrada agora: o comprovante é emitido quando o encaixe é recusado por falta de vaga.");
      return;
    }
    const janela = window.open("", "_blank", "width=720,height=820");
    if (!janela) {
      setErroEnvio("O navegador bloqueou a janela do comprovante. Permita pop-ups para este site.");
      return;
    }
    const n = naoRecebimento;
    const linhas: [string, string][] = [
      ["Registro", `#AG-${n.id}`],
      ["Data e hora", n.em.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })],
      ["Empresa (emitente da NF)", n.nota?.fornecedor.nome ?? "—"],
      ["Nota fiscal", n.nota ? `NF-e ${n.nota.numero ?? "s/ nº"} • chave ${n.nota.chave}` : "—"],
      ["Placa", n.placa || "—"],
      ["Motorista", n.motorista || "—"],
      ["Motivo", n.motivo],
    ];
    janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>Comprovante de não recebimento #AG-${n.id}</title>
      <style>body{font-family:Arial,sans-serif;margin:32px;color:#111}h1{color:#0a5aa4;font-size:20px;border-bottom:3px solid #f2b705;padding-bottom:6px}
      table{width:100%;border-collapse:collapse;margin-top:16px}th,td{text-align:left;padding:8px;border-bottom:1px solid #ddd;vertical-align:top}
      th{width:34%;color:#555;font-weight:600}.ass{margin-top:64px;display:flex;gap:48px}.ass div{flex:1;border-top:1px solid #333;padding-top:6px;font-size:12px;text-align:center}
      small{color:#666}</style></head><body>
      <h1>COCAPEC • Comprovante de não recebimento</h1>
      <small>Terminal Logístico Franca/SP — Portaria &amp; Balança 01</small>
      <table>${linhas.map(([k, v]) => `<tr><th>${escaparHtml(k)}</th><td>${escaparHtml(v)}</td></tr>`).join("")}</table>
      <p>O veículo compareceu sem agendamento e não pôde ser recebido por falta de vaga. O fornecedor deve agendar a entrega para outra data.</p>
      <div class="ass"><div>Portaria COCAPEC</div><div>Motorista</div></div>
      </body></html>`);
    janela.document.close();
    janela.focus();
    janela.print();
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
        onReceipt={emitirComprovante}
        onSubmit={submit}
      />
    </div>
  );
}
