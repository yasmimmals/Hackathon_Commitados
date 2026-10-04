"use client";

import { useEffect } from "react";


export default function RegistroPwa() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then((registro) => {
        const urls = performance
          .getEntriesByType("resource")
          .map((r) => r.name)
          .filter((u) => u.startsWith(location.origin) && new URL(u).pathname.startsWith("/_next/static/"));
        registro.active?.postMessage({ tipo: "CACHEAR", urls });
      })
      .catch((erro) => console.warn("PWA: service worker não registrado.", erro));
  }, []);

  return null;
}
