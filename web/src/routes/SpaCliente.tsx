"use client";

import dynamic from "next/dynamic";

/** O React Router depende de `window`, então o app de rotas só é montado no navegador. */
const AppRotas = dynamic(() => import("./AppRotas"), { ssr: false });

export default function SpaCliente() {
  return <AppRotas />;
}
