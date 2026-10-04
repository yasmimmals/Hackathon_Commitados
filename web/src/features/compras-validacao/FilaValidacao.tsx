import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Inbox, LoaderCircle, RefreshCw, ServerCrash } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import MensagemStatus from "@/shared/components/ui/MensagemStatus";
import { useMensagemTemporaria } from "@/shared/hooks/useMensagemTemporaria";
import { listarAgendamentos, mensagemDeErro, type Agendamento } from "@/shared/services";
import CardValidacao from "./components/CardValidacao";

type Carga = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "ok" };

export default function FilaValidacao() {
  const { usuario } = useAuth();
  const [pendentes, setPendentes] = useState<Agendamento[]>([]);
  const [carga, setCarga] = useState<Carga>({ tipo: "carregando" });
  const [feedback, setFeedback] = useMensagemTemporaria(6000);

  const carregar = useCallback(() => {
    let ativo = true;
    listarAgendamentos({ status: "PENDENTE" }).then(
      (lista) => {
        if (!ativo) return;
        setPendentes([...lista].sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`)));
        setCarga({ tipo: "ok" });
      },
      (erro) => ativo && setCarga({ tipo: "erro", mensagem: mensagemDeErro(erro) }),
    );
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(carregar, [carregar]);

  const recarregar = () => {
    setCarga({ tipo: "carregando" });
    carregar();
  };

  const concluir = (atualizado: Agendamento, acao: "aprovado" | "reprovado") => {
    setPendentes((lista) => lista.filter((a) => a.id !== atualizado.id));
    setFeedback(
      acao === "aprovado"
        ? `Agendamento #AG-${atualizado.id} aprovado (pedido ${atualizado.pedido_compra}). O armazém já pode definir a doca.`
        : `Agendamento #AG-${atualizado.id} reprovado. O fornecedor verá o motivo em Meus Agendamentos.`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
            <ClipboardCheck className="h-3.5 w-3.5" aria-hidden /> Mesa de Compras
          </p>
          <h1 className="titulo-pagina">Fila de Validação</h1>
          <p className="mt-2 max-w-prose text-sm text-gray-600">
            Confira a nota fiscal de cada agendamento contra o pedido de compra e aprove ou reprove a entrega.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {carga.tipo === "ok" && (
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-site-azul shadow-sm">
              {pendentes.length} {pendentes.length === 1 ? "pendente" : "pendentes"}
            </span>
          )}
          <button
            type="button"
            onClick={recarregar}
            disabled={carga.tipo === "carregando"}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${carga.tipo === "carregando" ? "animate-spin" : ""}`} aria-hidden /> Atualizar
          </button>
        </div>
      </div>

      <MensagemStatus mensagem={feedback} />

      {carga.tipo === "carregando" && (
        <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Carregando agendamentos pendentes…
        </p>
      )}

      {carga.tipo === "erro" && (
        <div role="alert" className="flex flex-col items-center gap-2 rounded-3xl bg-white px-4 py-10 text-center shadow-sm">
          <ServerCrash className="h-6 w-6 text-gray-400" aria-hidden />
          <p className="text-sm text-gray-700">Não foi possível carregar a fila de validação.</p>
          <p className="text-xs text-gray-500">{carga.mensagem}</p>
          <button type="button" onClick={recarregar} className="mt-1 text-sm font-semibold text-marca hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {carga.tipo === "ok" &&
        (pendentes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-white px-4 py-12 text-center shadow-sm">
            <Inbox className="h-8 w-8 text-gray-300" aria-hidden />
            <p className="font-semibold text-gray-700">Nenhum agendamento aguardando validação.</p>
            <p className="text-sm text-gray-500">Novos agendamentos dos fornecedores aparecem aqui.</p>
          </div>
        ) : (
          <ul className="space-y-5">
            {pendentes.map((ag) => (
              <li key={ag.id}>
                <CardValidacao agendamento={ag} analista={usuario?.nome ?? "Mesa de Compras"} onConcluido={concluir} />
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
