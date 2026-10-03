import { Link } from "react-router-dom";

export default function Breadcrumb() {
  return (
    <nav aria-label="Você está em" className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
      <Link to="/" className="hover:text-gray-700 hover:underline">Início</Link>
      <span aria-hidden>›</span>
      <span>Monitoramento Climático</span>
      <span aria-hidden>›</span>
      <span aria-current="page" className="font-semibold text-gray-700">Boletim Agrometeorológico</span>
    </nav>
  );
}
