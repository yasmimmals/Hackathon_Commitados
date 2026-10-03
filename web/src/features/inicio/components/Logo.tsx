/** Marca COCAPEC desenhada em SVG/CSS (o projeto ainda não tem os arquivos de logo). */
export default function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden>
        <circle cx="20" cy="20" r="18" fill="#f2b705" />
        <circle cx="20" cy="20" r="13" fill="#4ea72e" />
        <path d="M20 9c-5 5-5 15 0 22 5-7 5-17 0-22z" fill="#f2b705" />
        <path d="M20 12v16" stroke="#3f8f22" strokeWidth="1.5" />
      </svg>
      <span className="leading-none">
        <span className="block text-[28px] font-black tracking-tight text-site-azul">COCAPEC</span>
        <span className="block text-right text-[10px] font-semibold italic text-site-verde">O melhor café está aqui</span>
      </span>
    </span>
  );
}
