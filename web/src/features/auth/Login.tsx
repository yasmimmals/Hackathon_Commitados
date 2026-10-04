import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { mensagemDeErro } from "@/shared/services";
import { GRUPOS } from "@/routes/rotas";
import { useAuth } from "./AuthContext";
import LayoutAcesso, { CLASSE_INPUT_ACESSO as CLASSE_INPUT } from "./components/LayoutAcesso";
import { SENHA_DEMO, USUARIOS_DEMO } from "./usuariosDemo";
import { useIdioma } from "@/features/inicio/i18n";

export default function Login() {
  const { usuario, entrar, sair, sessaoExpirada } = useAuth();
  const { textos } = useIdioma();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro("");
    try {
      const logado = await entrar(email, senha);
      const base = GRUPOS[logado.perfil].base;
      const de = (location.state as { de?: string } | null)?.de;
      const destino = de && de !== "/" && de !== "/login" && (logado.admin || de.startsWith(base)) ? de : base;
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  };

  const preencherDemo = (emailDemo: string) => {
    setEmail(emailDemo);
    setSenha(SENHA_DEMO);
    setErro("");
  };

  return (
    <LayoutAcesso>
      <h1 className="mt-10 text-center text-3xl font-extrabold text-site-azul sm:text-4xl">{textos.login.titulo}</h1>
      <div className="mt-4 space-y-2 text-center text-sm leading-relaxed text-gray-800">
        <p>{textos.login.descricao1}</p>
        <p>{textos.login.descricao2}</p>
        <p className="font-bold">{textos.login.slogan}</p>
      </div>

      {usuario && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs text-site-azul">
          <span>
            {textos.login.conectadoComo} <strong>{usuario.nome}</strong> ({usuario.email})
          </span>
          <div className="flex items-center gap-3">
            <Link to={GRUPOS[usuario.perfil].base} className="font-bold underline hover:text-site-azul-escuro">
              {textos.login.continuar}
            </Link>
            <button
              type="button"
              onClick={() => sair()}
              className="font-medium text-gray-500 hover:text-red-600 underline"
            >
              {textos.login.trocarConta}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className="sr-only">{textos.login.email}</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            placeholder={textos.login.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CLASSE_INPUT}
          />
        </div>

        <div className="relative">
          <label htmlFor="senha" className="sr-only">{textos.login.senha}</label>
          <input
            id="senha"
            type={mostrarSenha ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder={textos.login.senha}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={`${CLASSE_INPUT} pr-14`}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((m) => !m)}
            aria-label={mostrarSenha ? textos.login.ocultarSenha : textos.login.mostrarSenha}
            aria-pressed={mostrarSenha}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul"
          >
            {mostrarSenha ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
        </div>

        {erro ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {erro}
          </p>
        ) : (
          sessaoExpirada && (
            <p role="status" className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              {textos.login.sessaoExpirada}
            </p>
          )
        )}

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-site-verde text-base font-bold text-white shadow-sm transition-colors hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          {enviando && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />} {textos.login.acessarJa}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-700">
        {textos.login.semAcesso}{" "}
        <Link to="/cadastro" className="font-bold text-site-azul hover:underline">
          {textos.login.criarCadastro}
        </Link>
      </p>

      <details className="mt-8 rounded-xl border border-dashed border-gray-300 p-3 text-xs">
        <summary className="cursor-pointer font-semibold text-site-azul">{textos.login.demoTitulo}</summary>
        <p className="mt-1 text-gray-500">
          {textos.login.demoDescricao} <strong className="font-mono text-gray-700">{SENHA_DEMO}</strong>. {textos.login.demoClique}
        </p>
        <ul className="mt-2 space-y-1">
          {USUARIOS_DEMO.map((u) => {
            const selecionado = email === u.email;
            return (
              <li key={u.email}>
                <button
                  type="button"
                  onClick={() => preencherDemo(u.email)}
                  className={`flex w-full flex-wrap items-center justify-between gap-x-2 rounded-md px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul ${
                    selecionado
                      ? "bg-sky-100 border border-site-azul/30 font-bold"
                      : "hover:bg-sky-50"
                  }`}
                >
                  <span className="font-semibold text-gray-800">{u.rotulo}</span>
                  <span className="break-all text-gray-500">{u.email}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </details>

      <Link
        to="/"
        className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-site-azul hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {textos.login.voltarInicio}
      </Link>
    </LayoutAcesso>
  );
}
