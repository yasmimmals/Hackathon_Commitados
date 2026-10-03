import { PONTOS_RADAR } from "../../constants";

export default function MapaRadar() {
  return (
    <svg viewBox="0 0 600 340" className="block h-auto w-full" role="img" aria-label="Mapa de radar com área de chuva a sudoeste de Franca">
      <defs>
        <radialGradient id="chuva-forte" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
          <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#22c55e" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="chuva-fraca" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {[60, 120, 180, 240].map((r) => (
        <circle key={r} cx="300" cy="190" r={r} fill="none" stroke="#2b3b4a" strokeDasharray="3 5" />
      ))}
      <line x1="300" y1="0" x2="300" y2="340" stroke="#2b3b4a" />
      <line x1="0" y1="190" x2="600" y2="190" stroke="#2b3b4a" />

      <ellipse cx="150" cy="80" rx="140" ry="90" fill="url(#chuva-forte)" transform="rotate(-25 150 80)" />
      <ellipse cx="470" cy="290" rx="110" ry="60" fill="url(#chuva-fraca)" />

      {PONTOS_RADAR.map((p) => (
        <g key={p.nome}>
          <circle cx={p.x} cy={p.y} r={p.principal ? 7 : 4} fill={p.principal ? "#ffffff" : "#38bdf8"} stroke="#0f1a24" strokeWidth="2" />
          <rect x={p.x - 52} y={p.y + 9} width="104" height="16" rx="4" fill="#0f1a24" fillOpacity="0.8" />
          <text x={p.x} y={p.y + 21} textAnchor="middle" fontSize={p.principal ? 10 : 9} fontWeight={p.principal ? 700 : 400} fill="#e2e8f0">
            {p.nome}
          </text>
        </g>
      ))}
    </svg>
  );
}
