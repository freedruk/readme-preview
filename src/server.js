// src/server.js
import http from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import open from "open";

export async function startServer({ html, port, openBrowser }) {
  const server = http.createServer((_, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  });

  await new Promise((r) => server.listen(port, r));

  const url = `http://localhost:${port}`;
  console.log(`Preview: ${url}`);
  console.log("Press Ctrl+C to stop.");

  if (openBrowser) {
    try {
      await open(url);
    } catch {}
  }
}

export async function writeBuild(html) {
  const dir = join(process.cwd(), ".readme-preview");
  mkdirSync(dir, { recursive: true });
  const out = join(dir, "index.html");
  writeFileSync(out, html, "utf8");
  return out;
}
