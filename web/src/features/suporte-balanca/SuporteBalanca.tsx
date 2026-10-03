import { useMemo, useState } from "react";
import MensagemStatus from "@/shared/components/ui/MensagemStatus";
import { useMensagemTemporaria } from "@/shared/hooks/useMensagemTemporaria";
import { focarPrimeiroErro, limparErros } from "@/shared/utils/formulario";
import BannerEspacoMotorista from "./components/BannerEspacoMotorista";
import ContactCards from "./components/ContactCards";
import FaqSection from "./components/FaqSection";
import PageHeader from "./components/PageHeader";
import SupportForm from "./components/SupportForm";
import { FAQ } from "./data/faq";
import type { Chamado, ChamadoErros } from "./types";
import { CHAMADO_VAZIO, filtrarFaq, horaAgora, idsDasPerguntas, validarChamado } from "./utils/suporte";

const TELEFONE_GUARITA = "tel:+551637116000";
const PROTOCOLO_INICIAL = 4821;

const rolarAte = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export default function SuporteBalanca() {
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState<Set<string>>(() => new Set([FAQ[0].itens[0].id]));
  const [chamado, setChamado] = useState(CHAMADO_VAZIO);
  const [erros, setErros] = useState<ChamadoErros>({});
  const [feedback, setFeedback] = useMensagemTemporaria();
  const [filaAtualizadaEm, setFilaAtualizadaEm] = useState(horaAgora);
  const [protocolo, setProtocolo] = useState(PROTOCOLO_INICIAL);

  const gruposFiltrados = useMemo(() => filtrarFaq(FAQ, busca), [busca]);

  // Ao pesquisar, abre automaticamente as respostas encontradas.
  const pesquisar = (valor: string) => {
    setBusca(valor);
    if (valor.trim()) setAbertos(new Set(idsDasPerguntas(filtrarFaq(FAQ, valor))));
  };

  const alternar = (id: string) =>
    setAbertos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });

  const alterarChamado = (alterados: Partial<Chamado>) => {
    setChamado((c) => ({ ...c, ...alterados }));
    setErros((e) => limparErros(e, alterados));
  };

  const limparChamado = () => {
    setChamado(CHAMADO_VAZIO);
    setErros({});
  };

  const enviarChamado = () => {
    const encontrados = validarChamado(chamado);
    setErros(encontrados);
    if (focarPrimeiroErro(encontrados)) return;

    setFeedback(`Chamado #BAL-${protocolo} enviado para a Balança Central. Veículo ${chamado.placa} — retorno em até 15 minutos.`);
    setProtocolo((p) => p + 1);
    setChamado(CHAMADO_VAZIO);
  };

  const atualizarFila = () => {
    setFilaAtualizadaEm(horaAgora());
    setFeedback("Status do pátio atualizado.");
  };

  return (
    <div>
      <PageHeader busca={busca} onBusca={pesquisar} onAbrirChamado={() => rolarAte("abrir-chamado")} />
      <MensagemStatus mensagem={feedback} />

      <ContactCards
        filaAtualizadaEm={filaAtualizadaEm}
        onAtualizarFila={atualizarFila}
        onLigarGuarita={() => (window.location.href = TELEFONE_GUARITA)}
      />

      <FaqSection
        grupos={gruposFiltrados}
        abertos={abertos}
        onAlternar={alternar}
        onExpandirTodos={() => setAbertos(new Set(idsDasPerguntas(gruposFiltrados)))}
        onRecolher={() => setAbertos(new Set())}
      />

      <SupportForm
        value={chamado}
        errors={erros}
        onChange={alterarChamado}
        onLimpar={limparChamado}
        onSubmit={enviarChamado}
      />

      <BannerEspacoMotorista />
    </div>
  );
}
