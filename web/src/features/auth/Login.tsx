import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarCheck, CloudSun, FileCheck2, LogIn, Truck } from "lucide-react";
import BarraSuperior from "@/features/inicio/components/BarraSuperior";
import Navegacao from "@/features/inicio/components/Navegacao";
import Footer from "@/shared/components/layout/Footer";
import { useAuth } from "./AuthContext";
import { GRUPOS } from "@/routes/rotas";
import { USUARIOS_DEMO } from "./usuariosDemo";

const CLASSE_INPUT =
  "w-full rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus-visible:border-site-azul focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul/30";

const VANTAGENS = [
  { icone: CalendarCheck, texto: "Agende a janela de descarga no Terminal Franca/SP" },
  { icone: FileCheck2, texto: "Envie a nota fiscal e acompanhe a validação de Compras" },
  { icone: CloudSun, texto: "Consulte a previsão de chuva antes de enviar adubo" },
];

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
    <div className="flex min-h-screen flex-col bg-fundo">
      <BarraSuperior />
      <Navegacao />

      <main className="mx-auto grid w-full max-w-[1100px] flex-1 items-start gap-6 px-4 py-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section
          aria-labelledby="portal-titulo"
          className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#084a87_0%,#0a5aa4_60%,#4ea72e_140%)] p-6 text-white shadow-sm md:p-8"
        >
          <Truck aria-hidden className="absolute -bottom-6 -right-6 h-48 w-48 text-white/10" />
          <p className="mb-2 w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            Portal de Agendamento de Cargas
          </p>
          <h1 id="portal-titulo" className="w-fit border-b-[3px] border-site-amarelo pb-1 text-3xl font-black italic md:text-4xl">
            Espaço Fornecedor
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/90 md:text-base">
            Acesso para fornecedores, Mesa de Compras e equipe do armazém da COCAPEC.
          </p>
          <ul className="relative mt-6 space-y-3">
            {VANTAGENS.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icone className="h-4 w-4 text-site-amarelo" aria-hidden />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </section>

        <div>
          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="titulo-pagina text-2xl">Entrar</h2>

            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-gray-700">
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
              <label htmlFor="senha" className="text-xs font-semibold text-gray-700">
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
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-site-verde px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2"
            >
              <LogIn className="h-4 w-4" aria-hidden /> Entrar
            </button>
          </form>

          <section className="mt-4 rounded-3xl border border-dashed border-gray-300 bg-white/70 p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-site-azul">Acessos de demonstração</h2>
            <p className="mt-1 text-xs text-gray-500">Qualquer senha funciona enquanto não há backend de login.</p>
            <ul className="mt-2 space-y-1">
              {USUARIOS_DEMO.map((u) => (
                <li key={u.email}>
                  <button
                    type="button"
                    onClick={() => preencherDemo(u.email)}
                    className="flex w-full flex-wrap items-center justify-between gap-x-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul"
                  >
                    <span className="font-semibold text-gray-800">{GRUPOS[u.perfil].rotulo}</span>
                    <span className="break-all text-gray-500">{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <Link
            to="/"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-site-azul hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Voltar para a página inicial
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
