import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import LogoCocapec from "@/shared/components/ui/LogoCocapec";
import { GRUPOS } from "@/routes/rotas";
import { useAuth } from "./AuthContext";
import { USUARIOS_DEMO } from "./usuariosDemo";

const CLASSE_INPUT =
  "h-14 w-full rounded-xl border border-gray-400 bg-white px-4 text-[15px] text-gray-900 placeholder:text-gray-500 focus-visible:border-site-azul focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul/30";

/** Símbolo da COCAPEC em contorno, usado como marca d'água no painel da esquerda. */
function MarcaDagua() {
  return (
    <svg viewBox="0 0 400 400" aria-hidden className="absolute -bottom-24 -left-24 h-140 w-140 text-white/25">
      <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="26" />
      <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="14" />
      <path d="M200 70 L130 290 Q200 250 270 290 Z" fill="currentColor" />
      <path d="M200 250 V340" stroke="currentColor" strokeWidth="14" />
    </svg>
  );
}

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
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
    <div className="flex min-h-screen bg-[linear-gradient(135deg,#0a5aa4_0%,#2f86a8_45%,#4ea72e_100%)]">
      {/* Painel decorativo (só em telas largas) */}
      <div className="relative hidden flex-1 overflow-hidden lg:block" aria-hidden>
        <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(115deg,transparent_0_60px,rgba(255,255,255,0.35)_60px_62px)]" />
        <MarcaDagua />
      </div>

      <main className="relative flex w-full flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:w-[42%] lg:min-w-130 lg:rounded-l-[48px] lg:px-12">
        <div className="mx-auto w-full max-w-130">
          <div className="flex justify-center">
            <LogoCocapec />
          </div>

          <h1 className="mt-10 text-center text-3xl font-extrabold text-site-azul sm:text-4xl">Espaço do Fornecedor</h1>
          <div className="mt-4 space-y-2 text-center text-sm leading-relaxed text-gray-800">
            <p>
              Fornecedor, este serviço foi pensado para estar ao seu lado, agilizando o agendamento das entregas no
              Terminal Franca/SP e o acompanhamento da validação das suas notas fiscais.
            </p>
            <p>Se precisar de ajuda com o acesso, nossa equipe estará sempre pronta para auxiliar.</p>
            <p className="font-bold">Juntos, crescemos mais!</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="sr-only">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={CLASSE_INPUT}
              />
            </div>

            <div className="relative">
              <label htmlFor="senha" className="sr-only">Senha</label>
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={`${CLASSE_INPUT} pr-14`}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((m) => !m)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul"
              >
                {mostrarSenha ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              </button>
            </div>

            {erro && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="h-11 w-full rounded-full bg-site-verde text-base font-bold text-white shadow-sm transition-colors hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2"
            >
              Acessar já
            </button>
          </form>

          <details className="mt-8 rounded-xl border border-dashed border-gray-300 p-3 text-xs">
            <summary className="cursor-pointer font-semibold text-site-azul">Acessos de demonstração</summary>
            <p className="mt-1 text-gray-500">Qualquer senha funciona enquanto não há backend de login.</p>
            <ul className="mt-2 space-y-1">
              {USUARIOS_DEMO.map((u) => (
                <li key={u.email}>
                  <button
                    type="button"
                    onClick={() => preencherDemo(u.email)}
                    className="flex w-full flex-wrap items-center justify-between gap-x-2 rounded-md px-2 py-1.5 text-left hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul"
                  >
                    <span className="font-semibold text-gray-800">{GRUPOS[u.perfil].rotulo}</span>
                    <span className="break-all text-gray-500">{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>

          <Link
            to="/"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-site-azul hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Voltar para a página inicial
          </Link>
        </div>
      </main>
    </div>
  );
}
