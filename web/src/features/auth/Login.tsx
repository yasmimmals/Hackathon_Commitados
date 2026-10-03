import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Leaf, LogIn } from "lucide-react";
import { useAuth } from "./AuthContext";
import { GRUPOS } from "@/routes/rotas";
import { USUARIOS_DEMO } from "./usuariosDemo";

const CLASSE_INPUT =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca";

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  if (usuario) return <Navigate to={GRUPOS[usuario.perfil].base} replace />;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const logado = entrar(email, senha);
      const base = GRUPOS[logado.perfil].base;
      const de = (location.state as { de?: string } | null)?.de;
      navigate(de?.startsWith(base) ? de : base, { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
    }
  };

  const preencherDemo = (emailDemo: string) => {
    setEmail(emailDemo);
    setSenha("demo");
    setErro("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-fundo px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-marca text-white"
            aria-hidden
          >
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-extrabold leading-tight text-gray-900">
              COCAPEC
            </p>
            <p className="text-xs text-gray-500">Agendamento de Cargas</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h1 className="text-xl font-bold text-gray-900">Entrar</h1>

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-gray-700"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={CLASSE_INPUT}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="senha"
              className="text-xs font-semibold text-gray-700"
            >
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={CLASSE_INPUT}
            />
          </div>

          {erro && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-marca px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-marca-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2"
          >
            <LogIn className="h-4 w-4" aria-hidden /> Entrar
          </button>
        </form>

        <section className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white/60 p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Acessos de demonstração
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Qualquer senha funciona enquanto não há backend.
          </p>
          <ul className="mt-2 space-y-1">
            {USUARIOS_DEMO.map((u) => (
              <li key={u.email}>
                <button
                  type="button"
                  onClick={() => preencherDemo(u.email)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-gray-100"
                >
                  <span className="font-semibold text-gray-800">
                    {GRUPOS[u.perfil].rotulo}
                  </span>
                  <span className="text-gray-500">{u.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
