/* Service worker do PWA COCAPEC.
 *
 * O app é uma SPA (React Router dentro de uma única página do Next): toda rota usa o
 * mesmo HTML ("casca"). Estratégias:
 *  - navegação: rede primeiro; sem rede, devolve a última casca salva (o React Router
 *    desenha a tela certa pela URL) ou uma página "sem conexão";
 *  - /_next/static e /icons: cache primeiro (arquivos versionados, nunca mudam);
 *  - outras requisições do próprio site: rede primeiro, com cópia em cache;
 *  - API do backend e Open-Meteo (outras origens): sempre pela rede, nunca em cache
 *    (dados com login e previsão precisam estar atualizados).
 */
const VERSAO = "cocapec-v1";
const CACHE_CASCA = `${VERSAO}-casca`;
const CACHE_ESTATICOS = `${VERSAO}-estaticos`;
const CHAVE_CASCA = "/__casca__";
const PRECACHE = ["/manifest.webmanifest", "/icons/icone-192.png", "/icons/icone-512.png"];

const PAGINA_OFFLINE = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Sem conexão • COCAPEC</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Ubuntu,system-ui,sans-serif;background:#ececec;color:#1f2937}
main{max-width:420px;margin:16px;padding:32px;border-radius:24px;background:#fff;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h1{color:#0a5aa4;font-style:italic;border-bottom:3px solid #f2b705;display:inline-block;padding-bottom:4px}
button{margin-top:16px;padding:12px 24px;border:0;border-radius:999px;background:#4ea72e;color:#fff;font-weight:700;font-size:15px;cursor:pointer}</style></head>
<body><main><img src="/icons/icone-192.png" width="72" height="72" alt=""><h1>Sem conexão</h1>
<p>Não foi possível carregar o portal agora. Verifique a internet e tente de novo.</p>
<button onclick="location.reload()">Tentar novamente</button></main></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_ESTATICOS).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => !n.startsWith(VERSAO)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const { tipo, urls } = event.data || {};
  if (tipo !== "CACHEAR" || !Array.isArray(urls)) return;
  event.waitUntil(
    caches.open(CACHE_ESTATICOS).then((cache) =>
      Promise.all(
        urls
          .filter((u) => new URL(u, self.location.origin).origin === self.location.origin)
          .map((u) => cache.match(u).then((achou) => achou || cache.add(u).catch(() => undefined))),
      ),
    ),
  );
});

const ehEstatico = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; 

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE_CASCA).then((cache) => cache.put(CHAVE_CASCA, copia));
          }
          return resposta;
        })
        .catch(async () =>
          (await caches.match(CHAVE_CASCA)) ||
          new Response(PAGINA_OFFLINE, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
        ),
    );
    return;
  }

  if (ehEstatico(url)) {
    event.respondWith(
      caches.match(request).then(
        (achou) =>
          achou ||
          fetch(request).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(CACHE_ESTATICOS).then((cache) => cache.put(request, copia));
            }
            return resposta;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE_ESTATICOS).then((cache) => cache.put(request, copia));
        }
        return resposta;
      })
      .catch(() => caches.match(request).then((achou) => achou || Response.error())),
  );
});
