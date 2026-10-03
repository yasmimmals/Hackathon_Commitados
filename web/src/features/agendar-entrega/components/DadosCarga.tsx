import { Package, Scale, Tags } from "lucide-react";
import Campo, { CLASSE_CAMPO, tomCampo } from "@/shared/components/ui/Campo";
import { ACONDICIONAMENTOS, CATEGORIAS, PESO_MAXIMO_T } from "../constants";
import type { Acondicionamento, Categoria, ErrosEntrega, NovaEntrega } from "../types";
import { mascararPeso } from "../utils/agendamento";
import Secao from "./Secao";

type DadosCargaProps = {
  value: Pick<NovaEntrega, "categoria" | "acondicionamento" | "peso">;
  erros: Pick<ErrosEntrega, "categoria" | "acondicionamento" | "peso">;
  onCategoria: (categoria: Categoria) => void;
  onChange: (patch: Partial<NovaEntrega>) => void;
};

const opcao = (ativo: boolean) =>
  [
    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-marca",
    ativo ? "border-marca bg-emerald-50 ring-1 ring-marca" : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50",
  ].join(" ");

export default function DadosCarga({ value, erros, onCategoria, onChange }: DadosCargaProps) {
  return (
    <Secao numero={2} titulo="Dados da carga" descricao="Categoria, acondicionamento e peso conforme a nota fiscal.">
      <div className="space-y-5">
        <fieldset
          id="categoria"
          tabIndex={-1}
          aria-describedby={erros.categoria ? "categoria-erro" : undefined}
          className="focus:outline-none"
        >
          <legend className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Tags className="h-3.5 w-3.5 text-marca" aria-hidden /> Categoria
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {CATEGORIAS.map(({ key, rotulo, descricao, icone: Icone }) => {
              const ativo = value.categoria === key;
              return (
                <label key={key} className={opcao(ativo)}>
                  <input
                    type="radio"
                    name="categoria"
                    value={key}
                    checked={ativo}
                    onChange={() => onCategoria(key)}
                    className="sr-only"
                  />
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ativo ? "bg-marca text-white" : "bg-emerald-50 text-marca"}`}>
                    <Icone className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{rotulo}</span>
                    <span className="block text-[11px] text-gray-500">{descricao}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {erros.categoria && <p id="categoria-erro" className="mt-1 text-xs text-red-600">{erros.categoria}</p>}
        </fieldset>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
          <fieldset
            id="acondicionamento"
            tabIndex={-1}
            aria-describedby={erros.acondicionamento ? "acondicionamento-erro" : undefined}
            className="focus:outline-none"
          >
            <legend className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Package className="h-3.5 w-3.5 text-marca" aria-hidden /> Tipo de acondicionamento
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {ACONDICIONAMENTOS.map(({ key, rotulo, icone: Icone }) => {
                const ativo = value.acondicionamento === key;
                return (
                  <label key={key} className={`${opcao(ativo)} justify-center text-xs font-semibold ${ativo ? "text-marca" : "text-gray-700"}`}>
                    <input
                      type="radio"
                      name="acondicionamento"
                      value={key}
                      checked={ativo}
                      onChange={() => onChange({ acondicionamento: key as Acondicionamento })}
                      className="sr-only"
                    />
                    <Icone className="h-4 w-4 shrink-0" aria-hidden /> {rotulo}
                  </label>
                );
              })}
            </div>
            {erros.acondicionamento && (
              <p id="acondicionamento-erro" className="mt-1 text-xs text-red-600">{erros.acondicionamento}</p>
            )}
          </fieldset>

          <Campo id="peso" rotulo="Peso líquido" icone={Scale} erro={erros.peso}>
            <div className="relative">
              <input
                id="peso"
                inputMode="decimal"
                autoComplete="off"
                value={value.peso}
                onChange={(e) => onChange({ peso: mascararPeso(e.target.value) })}
                placeholder="28,00"
                aria-invalid={!!erros.peso}
                aria-describedby={erros.peso ? "peso-erro" : "peso-dica"}
                className={`${CLASSE_CAMPO} ${tomCampo(erros.peso)} pr-16`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                toneladas
              </span>
            </div>
            {!erros.peso && <p id="peso-dica" className="mt-1 text-[11px] text-gray-500">Máximo {PESO_MAXIMO_T} t por veículo.</p>}
          </Campo>
        </div>
      </div>
    </Secao>
  );
}
