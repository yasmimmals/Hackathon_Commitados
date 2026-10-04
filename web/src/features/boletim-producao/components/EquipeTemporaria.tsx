import { useId, useState, type FormEvent } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { CHAPAS_CADASTRO, EFETIVOS, MAX_CHAPAS } from "../constants";
import type { ChapaEscalado } from "../types";
import { decimal } from "../utils/calculo";

type EquipeTemporariaProps = {
  chapas: ChapaEscalado[];
  bloqueado: boolean;
  onChange: (chapas: ChapaEscalado[]) => void;
};

/** Busca o nome no cadastro (temporários e efetivos, para a validação apontar o efetivo). */
const nomeCadastrado = (matricula: string) =>
  [...CHAPAS_CADASTRO, ...EFETIVOS].find((c) => c.matricula === matricula.trim().toUpperCase())?.nome ?? "";

export default function EquipeTemporaria({ chapas, bloqueado, onChange }: EquipeTemporariaProps) {
  const idLista = useId();
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [meia, setMeia] = useState(false);
  const [erro, setErro] = useState("");

  const completas = chapas.filter((c) => !c.meiaDiaria).length;
  const meias = chapas.length - completas;

  const adicionar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const m = matricula.trim().toUpperCase();
    const n = (nome || nomeCadastrado(m)).trim();
    if (!m || !n) {
      setErro("Informe a matrícula e o nome do chapa.");
      return;
    }
    onChange([...chapas, { matricula: m, nome: n, meiaDiaria: meia }]);
    setMatricula("");
    setNome("");
    setMeia(false);
    setErro("");
  };

  const atualizar = (i: number, patch: Partial<ChapaEscalado>) =>
    onChange(chapas.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <section aria-labelledby="equipe-titulo" className="rounded-3xl bg-white p-5 shadow-sm">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b-[3px] border-site-amarelo pb-2">
        <h2 id="equipe-titulo" className="titulo-secao text-lg">2. Equipe temporária</h2>
        <p className="text-xs text-gray-600">
          <strong className="text-gray-900">{chapas.length}</strong>/{MAX_CHAPAS} chapas • {completas} diária(s) completa(s) •{" "}
          {meias} meia(s) • <strong className="text-gray-900">{decimal(completas + meias * 0.5)}</strong> diárias equivalentes
        </p>
      </header>

      {!bloqueado && (
        <form noValidate onSubmit={adicionar} className="mb-4 grid gap-2 rounded-2xl bg-gray-50 p-3 sm:grid-cols-[140px_minmax(0,1fr)_auto_auto] sm:items-end">
          <label className="text-xs font-semibold text-gray-700">
            Matrícula
            <input
              list={idLista}
              value={matricula}
              onChange={(e) => {
                setMatricula(e.target.value);
                setNome(nomeCadastrado(e.target.value));
              }}
              placeholder="CH-001"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm uppercase"
            />
            <datalist id={idLista}>
              {CHAPAS_CADASTRO.map((c) => (
                <option key={c.matricula} value={c.matricula}>{c.nome}</option>
              ))}
            </datalist>
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Diária
            <select
              value={meia ? "meia" : "completa"}
              onChange={(e) => setMeia(e.target.value === "meia")}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="completa">Completa</option>
              <option value="meia">Meia</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-site-azul px-4 py-2 text-sm font-bold text-white hover:bg-site-azul-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul focus-visible:ring-offset-2"
          >
            <UserPlus className="h-4 w-4" aria-hidden /> Adicionar
          </button>
          {erro && <p role="alert" className="text-sm text-red-700 sm:col-span-4">{erro}</p>}
        </form>
      )}

      {chapas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">Nenhum chapa escalado.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {chapas.map((c, i) => (
            <li key={`${c.matricula}-${i}`} className="flex flex-wrap items-center gap-3 py-2">
              <span className="w-6 text-right text-xs text-gray-400">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-gray-900">{c.nome}</span>
                <span className="block font-mono text-xs text-gray-500">{c.matricula}</span>
              </span>
              <div role="group" aria-label={`Diária de ${c.nome}`} className="flex rounded-full bg-gray-100 p-0.5 text-xs font-semibold">
                {[false, true].map((ehMeia) => (
                  <button
                    key={String(ehMeia)}
                    type="button"
                    disabled={bloqueado}
                    aria-pressed={c.meiaDiaria === ehMeia}
                    onClick={() => atualizar(i, { meiaDiaria: ehMeia })}
                    className={`rounded-full px-3 py-1 transition-colors disabled:cursor-default ${
                      c.meiaDiaria === ehMeia ? "bg-white text-site-azul shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {ehMeia ? "Meia" : "Completa"}
                  </button>
                ))}
              </div>
              {!bloqueado && (
                <button
                  type="button"
                  onClick={() => onChange(chapas.filter((_, j) => j !== i))}
                  aria-label={`Remover ${c.nome}`}
                  className="rounded-full p-2 text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
