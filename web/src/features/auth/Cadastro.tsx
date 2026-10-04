import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, ClipboardCheck, LoaderCircle, Truck, Warehouse, type LucideIcon } from "lucide-react";
import { mensagemDeErro, type CadastroIn } from "@/shared/services";
import { GRUPOS } from "@/routes/rotas";
import { useAuth } from "./AuthContext";
import LayoutAcesso, { CLASSE_INPUT_ACESSO } from "./components/LayoutAcesso";

type PerfilCadastro = CadastroIn["perfil"];

const PERFIS: { valor: PerfilCadastro; rotulo: string; descricao: string; icone: LucideIcon }[] = [
  { valor: "FORNECEDOR", rotulo: "Fornecedor", descricao: "Agenda entregas da empresa", icone: Truck },
  { valor: "COMPRAS", rotulo: "Comprador", descricao: "Mesa de Compras: valida notas", icone: ClipboardCheck },
  { valor: "ARMAZEM", rotulo: "Resp. pelo armazém", descricao: "Recebimento e boletim", icone: Warehouse },
];

const SENHA_MINIMA = 8;

function mascararCnpj(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

type Campos = {
  nome: string;
  email: string;
  senha: string;
  confirmacao: string;
  empresa: string;
  cnpj: string;
  codigo: string;
};

const VAZIO: Campos = { nome: "", email: "", senha: "", confirmacao: "", empresa: "", cnpj: "", codigo: "" };

function validar(perfil: PerfilCadastro, c: Campos): Partial<Record<keyof Campos, string>> {
  const erros: Partial<Record<keyof Campos, string>> = {};
  if (c.nome.trim().length < 2) erros.nome = "Informe seu nome.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email.trim())) erros.email = "Informe um e-mail válido.";
  if (c.senha.length < SENHA_MINIMA) erros.senha = `A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`;
  if (c.confirmacao !== c.senha) erros.confirmacao = "As senhas não conferem.";
  if (perfil === "FORNECEDOR") {
    if (c.empresa.trim().length < 2) erros.empresa = "Informe a razão social da empresa.";
    if (c.cnpj.replace(/\D/g, "").length !== 14) erros.cnpj = "O CNPJ precisa ter 14 dígitos.";
  } else if (!c.codigo.trim()) {
    erros.codigo = "Informe o código interno fornecido pela COCAPEC.";
  }
  return erros;
}

export default function Cadastro() {
  const { usuario, cadastrar } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilCadastro>("FORNECEDOR");
  const [campos, setCampos] = useState<Campos>(VAZIO);
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({});
  const [erroEnvio, setErroEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={GRUPOS[usuario.perfil].base} replace />;

  const alterar = (campo: keyof Campos, valor: string) => {
    setCampos((c) => ({ ...c, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
    setErroEnvio("");
  };

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const encontrados = validar(perfil, campos);
    setErros(encontrados);
    const primeiro = Object.keys(encontrados)[0];
    if (primeiro) {
      document.getElementById(`cadastro-${primeiro}`)?.focus();
      return;
    }
    setEnviando(true);
    setErroEnvio("");
    try {
      const fornecedor = perfil === "FORNECEDOR";
      const logado = await cadastrar({
        perfil,
        nome: campos.nome.trim(),
        email: campos.email.trim(),
        senha: campos.senha,
        empresa: fornecedor ? campos.empresa.trim() : undefined,
        cnpj: fornecedor ? campos.cnpj : undefined,
        codigo_interno: fornecedor ? undefined : campos.codigo.trim(),
      });
      navigate(GRUPOS[logado.perfil].base, { replace: true });
    } catch (falha) {
      setErroEnvio(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  };

  const campo = (id: keyof Campos, rotulo: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`cadastro-${id}`} className="mb-1 block text-xs font-semibold text-gray-700">{rotulo}</label>
      <input
        id={`cadastro-${id}`}
        value={campos[id]}
        onChange={(e) => alterar(id, id === "cnpj" ? mascararCnpj(e.target.value) : e.target.value)}
        aria-invalid={!!erros[id]}
        aria-describedby={erros[id] ? `cadastro-${id}-erro` : undefined}
        className={`${CLASSE_INPUT_ACESSO} h-12 ${erros[id] ? "border-red-400" : ""}`}
        {...props}
      />
      {erros[id] && <p id={`cadastro-${id}-erro`} className="mt-1 text-xs text-red-600">{erros[id]}</p>}
    </div>
  );

  return (
    <LayoutAcesso>
      <h1 className="mt-8 text-center text-3xl font-extrabold text-site-azul">Criar cadastro</h1>
      <p className="mt-2 text-center text-sm text-gray-700">Escolha seu perfil de acesso ao portal de agendamento.</p>

      <form noValidate onSubmit={enviar} className="mt-6 space-y-4">
        <fieldset>
          <legend className="sr-only">Perfil de acesso</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {PERFIS.map(({ valor, rotulo, descricao, icone: Icone }) => {
              const ativo = perfil === valor;
              return (
                <label
                  key={valor}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-site-azul ${
                    ativo ? "border-site-azul bg-sky-50 ring-1 ring-site-azul" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="perfil"
                    value={valor}
                    checked={ativo}
                    onChange={() => {
                      setPerfil(valor);
                      setErros({});
                      setErroEnvio("");
                    }}
                    className="sr-only"
                  />
                  <Icone className={`h-5 w-5 ${ativo ? "text-site-azul" : "text-gray-500"}`} aria-hidden />
                  <span className={`text-sm font-bold ${ativo ? "text-site-azul" : "text-gray-800"}`}>{rotulo}</span>
                  <span className="text-[11px] leading-tight text-gray-500">{descricao}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {campo("nome", "Nome completo", { autoComplete: "name" })}
        {campo("email", "E-mail", { type: "email", autoComplete: "email" })}

        {perfil === "FORNECEDOR" ? (
          <div className="space-y-4 rounded-2xl bg-gray-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Building2 className="h-4 w-4 text-site-azul" aria-hidden /> Empresa
            </p>
            {campo("empresa", "Razão social", { autoComplete: "organization" })}
            {campo("cnpj", "CNPJ", { inputMode: "numeric", placeholder: "00.000.000/0000-00" })}
            <p className="text-[11px] text-gray-500">Se a empresa já tiver cadastro na COCAPEC, sua conta é vinculada a ela pelo CNPJ.</p>
          </div>
        ) : (
          campo("codigo", "Código interno (fornecido pela COCAPEC)", { autoComplete: "off" })
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {campo("senha", `Senha (mín. ${SENHA_MINIMA} caracteres)`, { type: "password", autoComplete: "new-password" })}
          {campo("confirmacao", "Confirme a senha", { type: "password", autoComplete: "new-password" })}
        </div>

        {erroEnvio && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{erroEnvio}</p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-site-verde text-base font-bold text-white shadow-sm transition-colors hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          {enviando && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />} Criar cadastro
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-700">
        Já tem acesso?{" "}
        <Link to="/login" className="font-bold text-site-azul hover:underline">Entrar</Link>
      </p>
      <Link to="/" className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-site-azul hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Voltar para a página inicial
      </Link>
    </LayoutAcesso>
  );
}
