import { useId, useState, type FormEvent } from "react";
import { LoaderCircle, Trash2, UserPlus } from "lucide-react";
import type { Chapa, ChapaNoBoletim, ChapaNoBoletimIn } from "@/shared/services";
import { decimal } from "@/shared/utils/formatacao";
import { MAX_CHAPAS } from "../utils/boletim";

type EquipeTemporariaProps = {
  equipe: ChapaNoBoletim[];
  chapas: Chapa[];
  bloqueado: boolean;
  salvando: boolean;
  onSalvar: (equipe: ChapaNoBoletimIn[]) => Promise<boolean>;
  onCadastrarChapa: (matricula: string, nome: string) => Promise<boolean>;
};

export default function EquipeTemporaria({ equipe, chapas, bloqueado, salvando, onSalvar, onCadastrarChapa }: EquipeTemporariaProps) {
  const idLista = useId();
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [meia, setMeia] = useState(false);
  const [erro, setErro] = useState("");

  const ativos = chapas.filter((c) => c.ativo);
  const cadastrado = (m: string) => ativos.find((c) => c.matricula.toUpperCase() === m.trim().toUpperCase());
  const naoCadastrado = matricula.trim() !== "" && !cadastrado(matricula);

  const completas = equipe.filter((c) => !c.meia_diaria).length;
  const meias = equipe.length - completas;
  const atual = (): ChapaNoBoletimIn[] => equipe.map(({ matricula: m, meia_diaria }) => ({ matricula: m, meia_diaria }));

  const adicionar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro("");
    const m = matricula.trim();
    if (!m) {
      setErro("Informe a matrícula do chapa.");
      return;
    }
    let registro = cadastrado(m);
    if (!registro) {
      if (nome.trim().length < 2) {
        setErro("Matrícula fora do cadastro: informe o nome para cadastrar o chapa temporário.");
        return;
      }
      if (!(await onCadastrarChapa(m, nome.trim()))) return;
      registro = { id: 0, matricula: m, nome: nome.trim(), ativo: true };
    }
    if (await onSalvar([...atual(), { matricula: registro.matricula, meia_diaria: meia }])) {
      setMatricula("");
      setNome("");
      setMeia(false);
    }
  };

  return (
    <section aria-labelledby="equipe-titulo" className="rounded-3xl bg-white p-5 shadow-sm">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b-[3px] border-site-amarelo pb-2">
        <h2 id="equipe-titulo" className="titulo-secao text-lg">2. Equipe temporária</h2>
        <p className="text-xs text-gray-600">
          <strong className="text-gray-900">{equipe.length}</strong>/{MAX_CHAPAS} chapas • {completas} completa(s) • {meias} meia(s) •{" "}
          <strong className="text-gray-900">{decimal(completas + meias * 0.5)}</strong> diárias equivalentes
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
                setNome(cadastrado(e.target.value)?.nome ?? "");
              }}
              placeholder="CH-001"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm uppercase"
            />
            <datalist id={idLista}>
              {ativos.map((c) => (
                <option key={c.id} value={c.matricula}>{c.nome}</option>
              ))}
            </datalist>
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Nome {naoCadastrado && <span className="font-normal text-amber-700">(novo no cadastro)</span>}
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              readOnly={!naoCadastrado && matricula.trim() !== ""}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm read-only:bg-gray-100"
            />
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
            disabled={salvando || equipe.length >= MAX_CHAPAS}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-site-azul px-4 py-2 text-sm font-bold text-white hover:bg-site-azul-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
            {naoCadastrado ? "Cadastrar e adicionar" : "Adicionar"}
          </button>
          {erro && <p role="alert" className="text-sm text-red-700 sm:col-span-4">{erro}</p>}
        </form>
      )}

      {equipe.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">Nenhum chapa escalado.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {equipe.map((c, i) => (
            <li key={c.matricula} className="flex flex-wrap items-center gap-3 py-2">
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
                    disabled={bloqueado || salvando}
                    aria-pressed={c.meia_diaria === ehMeia}
                    onClick={() =>
                      c.meia_diaria !== ehMeia &&
                      onSalvar(atual().map((x) => (x.matricula === c.matricula ? { ...x, meia_diaria: ehMeia } : x)))
                    }
                    className={`rounded-full px-3 py-1 transition-colors disabled:cursor-default ${
                      c.meia_diaria === ehMeia ? "bg-white text-site-azul shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {ehMeia ? "Meia" : "Completa"}
                  </button>
                ))}
              </div>
              {!bloqueado && (
                <button
                  type="button"
                  disabled={salvando}
                  onClick={() => onSalvar(atual().filter((x) => x.matricula !== c.matricula))}
                  aria-label={`Remover ${c.nome}`}
                  className="rounded-full p-2 text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
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
