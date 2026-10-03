import { useState } from "react";
import MensagemStatus from "@/shared/components/ui/MensagemStatus";
import { useMensagemTemporaria } from "@/shared/hooks/useMensagemTemporaria";
import { focarPrimeiroErro, limparErros } from "@/shared/utils/formulario";
import PageHeader from "./components/PageHeader";
import WarehouseAvailability from "./components/WarehouseAvailability";
import YardEntryForm from "./components/YardEntryForm";
import { ARMAZENS_MOCK, ENTRADA_VAZIA, POSICAO_INICIAL_FILA } from "./data/armazensMock";
import type { Packaging, WarehouseId, YardEntry, YardEntryErrors } from "./types";
import { gerarChaveNfeAleatoria, validarEntrada } from "./utils/entradaPatio";

export default function AgendarNaHora() {
  const [warehouses, setWarehouses] = useState(ARMAZENS_MOCK);
  const [entry, setEntry] = useState(ENTRADA_VAZIA);
  const [errors, setErrors] = useState<YardEntryErrors>({});
  const [feedback, setFeedback] = useMensagemTemporaria();
  const [queuePosition, setQueuePosition] = useState(POSICAO_INICIAL_FILA);

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

  const simulateScan = () => {
    change({ nfeKey: gerarChaveNfeAleatoria() });
    setFeedback("Código de barras da NF-e lido com sucesso.");
  };

  const submit = () => {
    const found = validarEntrada(entry);
    setErrors(found);
    if (focarPrimeiroErro(found)) return;

    const w = warehouses.find((x) => x.id === entry.warehouse)!;
    if (w.slots === 0) {
      setFeedback(`O armazém ${w.name} ficou sem vagas. Escolha outro armazém.`);
      return;
    }

    setWarehouses((list) => list.map((x) => (x.id === w.id ? { ...x, slots: x.slots - 1 } : x)));
    setFeedback(`Veículo ${entry.plate} na fila: ${queuePosition}º para ${w.name} (${w.dock}). O motorista será chamado no WhatsApp ${entry.whatsapp}.`);
    setQueuePosition((p) => p + 1);

    // Prepara o próximo encaixe já apontando para um armazém que ainda tenha vaga.
    const nextWarehouse = w.slots - 1 > 0 ? w : warehouses.find((x) => x.id !== w.id && x.slots > 0);
    setEntry({
      ...ENTRADA_VAZIA,
      warehouse: nextWarehouse?.id ?? w.id,
      packaging: nextWarehouse?.accepts[0] ?? ENTRADA_VAZIA.packaging,
    });
  };

  return (
    <div>
      <PageHeader />
      <MensagemStatus mensagem={feedback} />
      <WarehouseAvailability warehouses={warehouses} selected={entry.warehouse} onSelect={selectWarehouse} />
      <YardEntryForm
        value={entry}
        errors={errors}
        warehouses={warehouses}
        onChange={change}
        onSelectWarehouse={selectWarehouse}
        onSelectPackaging={selectPackaging}
        onSimulateScan={simulateScan}
        onReceipt={() => setFeedback("\"Comprovante de não recebimento\" estará disponível em breve.")}
        onSubmit={submit}
      />
    </div>
  );
}
