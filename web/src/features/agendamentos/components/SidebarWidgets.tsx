import type { ReactNode } from "react";
import { CloudRain, Phone } from "lucide-react";

function Widget({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

const forecast = [
  { day: "Hoje", rain: 65 },
  { day: "Qui 16", rain: 20 },
  { day: "Sex 17", rain: 5 },
];

const scales = [
  { name: "Balança 01", vehicles: 2 },
  { name: "Balança 02", vehicles: 1 },
];

export default function SidebarWidgets() {
  return (
    <aside className="space-y-4">
      

      <Widget
        title="Boletim de Chuva • Franca"
        aside={
          <CloudRain
            className="h-4 w-4 text-gray-500"
            aria-label="Previsão de chuva"
          />
        }
      >
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          {forecast.map(({ day, rain }) => {
            const high = rain >= 50;
            return (
              <div
                key={day}
                className={`rounded-lg p-2 ${high ? "bg-amber-50 ring-1 ring-amber-200" : "bg-sky-50"}`}
              >
                <span className="block text-[11px] text-gray-500">{day}</span>
                <span
                  className={`text-sm font-bold ${high ? "text-amber-700" : "text-sky-800"}`}
                >
                  {rain}% chuva
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs leading-relaxed text-gray-500">
          Moegas cobertas e cargas Big Bag seguem sem restrição de operação.
        </p>
      </Widget>

      <Widget title="Fila na Balança Franca">
        <ul className="space-y-2">
          {scales.map(({ name, vehicles }) => (
            <li
              key={name}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs"
            >
              <span className="text-gray-700">{name}</span>
              <span className="font-semibold text-marca">
                {vehicles} {vehicles === 1 ? "veículo" : "veículos"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>Balança &amp; Portaria</span>
          <a
            href="tel:+551637116000"
            className="inline-flex items-center gap-1 font-medium text-gray-700 hover:text-marca"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden /> (16) 3711-6000
          </a>
        </div>
      </Widget>
    </aside>
  );
}
