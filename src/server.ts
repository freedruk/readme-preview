// src/server.ts
import http from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import open from "open";

interface StartServerOptions {
  html: string;
  port: number;
  openBrowser: boolean;
}

export async function startServer({
  html,
  port,
  openBrowser,
}: StartServerOptions): Promise<void> {
  const server = http.createServer((_, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  });

  await new Promise<void>((r) => server.listen(port, r));

  const url = `http://localhost:${port}`;
  console.log(`Preview: ${url}`);
  console.log("Press Ctrl+C to stop.");

  if (openBrowser) {
    try {
      await open(url);
    } catch {}
  }
}

export async function writeBuild(html: string): Promise<string> {
  const dir = join(process.cwd(), ".readme-preview");
  mkdirSync(dir, { recursive: true });
  const out = join(dir, "index.html");
  writeFileSync(out, html, "utf8");
  return out;
}
