import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".puml": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ caminho: string[] }> }
) {
  const { caminho } = await context.params;
  if (!caminho || caminho.length === 0) {
    return new NextResponse("Caminho não informado", { status: 400 });
  }

  // Caminho absoluto para a pasta docs/ na raiz do repositório
  const docsRoot = path.resolve(process.cwd(), "../docs");
  const subcaminho = path.join(...caminho);
  const caminhoCompleto = path.resolve(docsRoot, subcaminho);

  // Evita directory traversal fora da pasta docs
  if (!caminhoCompleto.startsWith(docsRoot)) {
    return new NextResponse("Acesso não permitido", { status: 403 });
  }

  if (!fs.existsSync(caminhoCompleto)) {
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }

  const stat = fs.statSync(caminhoCompleto);
  if (!stat.isFile()) {
    return new NextResponse("Não é um arquivo", { status: 400 });
  }

  const ext = path.extname(caminhoCompleto).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const buffer = fs.readFileSync(caminhoCompleto);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
