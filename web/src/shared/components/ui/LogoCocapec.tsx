import { TreePine } from "lucide-react";

export default function LogoCocapec() {
  return (
    <span className="flex items-center gap-2">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center" aria-hidden>
        <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full">
          <circle cx="22" cy="22" r="19" fill="none" stroke="#4ea72e" strokeWidth="4" strokeLinecap="round" strokeDasharray="56 63.4" transform="rotate(132 22 22)" />
          <circle cx="22" cy="22" r="19" fill="none" stroke="#0a5aa4" strokeWidth="4" strokeLinecap="round" strokeDasharray="49 70.4" transform="rotate(325 22 22)" />
          <circle cx="22" cy="22" r="14" fill="#f2b705" />
        </svg>
        <span className="relative flex items-end -space-x-2 pb-0.5">
          <TreePine className="h-5 w-5 text-[#3f9b2f]" fill="currentColor" strokeWidth={1.5} />
          <TreePine className="h-4.5 w-4.5 text-site-verde" fill="currentColor" strokeWidth={1.5} />
        </span>
      </span>
      <span className="leading-none">
        <span className="block text-[30px] font-bold tracking-[-0.04em] text-site-azul">COCAPEC</span>
        <span className="block text-right text-[10px] font-bold italic text-site-verde">O melhor café está aqui</span>
      </span>
    </span>
  );
}
