"use client";

import dynamic from "next/dynamic";

const AppRotas = dynamic(() => import("./AppRotas"), { ssr: false });

export default function SpaCliente() {
  return <AppRotas />;
}
