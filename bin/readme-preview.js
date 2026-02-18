#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { startServer } from "../src/server.js";
import { renderReadmeHtml } from "../src/render.js";
import { runChecks } from "../src/check.js";
import { runInit } from "../src/init.js";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "../package.json"), "utf8"),
    );
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

async function main() {
  const args = process.argv.slice(2);

  const has = (f) => args.includes(f);
  const get = (name, fallback) => {
    const i = args.indexOf(name);
    if (i === -1) return fallback;
    const v = args[i + 1];
    return v && !v.startsWith("-") ? v : true;
  };

  const cmd = args[0] && !args[0].startsWith("-") ? args[0] : "preview";

  /* ---------- HELP ---------- */

  if (has("--help") || has("-h")) {
    printHelp();
    return;
  }

  if (has("--version") || has("-v")) {
    console.log(getVersion());
    return;
  }

  /* ---------- INIT ---------- */

  if (cmd === "init") {
    await runInit({
      cwd: process.cwd(),
      force: has("--force"),
      workflowOnly: has("--workflow-only"),
      readmeOnly: has("--readme-only"),
      addAssets: has("--assets"),
      workflowName: String(get("--workflow-name", "README Preview Check")),
    });
    return;
  }

  /* ---------- LOAD FILE ---------- */

  const file = resolve(process.cwd(), get("--file", "README.md"));
  const port = Number(get("--port", "4173"));
  const noOpen = Boolean(get("--no-open", false));
  const title = String(get("--title", "README Preview"));
  const theme = String(get("--theme", "npm"));
  const branch = String(get("--branch", "HEAD"));
  const baseUrl = get("--base-url", null);
  const rewriteLinks = has("--rewrite-links");
  const strict = has("--strict");

  let md;
  try {
    md = readFileSync(file, "utf8");
  } catch {
    console.error(`❌ Could not read file: ${file}`);
    process.exit(1);
  }

  /* ---------- CHECK ---------- */

  if (cmd === "check") {
    const { issues, strictIssues } = runChecks(md);
    const all = strict ? [...issues, ...strictIssues] : issues;

    if (all.length === 0) {
      console.log("✅ README passed checks.");
      return;
    }

    console.log("⚠️ README issues:");
    for (const i of all) console.log(`- ${i}`);
    process.exit(1);
  }

  /* ---------- RENDER ---------- */

  const html = renderReadmeHtml(md, {
    title,
    cwd: process.cwd(),
    theme,
    branch,
    baseUrl: baseUrl === true ? null : baseUrl,
    rewriteLinks,
  });

  /* ---------- BUILD ---------- */

  if (cmd === "build") {
    const { writeBuild } = await import("../src/server.js");
    const out = await writeBuild(html);
    console.log(`✅ Wrote preview to: ${out}`);
    return;
  }

  /* ---------- PREVIEW ---------- */

  if (cmd === "preview") {
    await startServer({ html, port, openBrowser: !noOpen });
    return;
  }

  console.error(`❌ Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}

/* ---------- HELP TEXT ---------- */

function printHelp() {
  console.log(`
readme-preview

Preview, lint, and bootstrap README quality before publishing.

Usage:
  readme-preview [command] [options]

Commands:
  preview (default)   Preview README in browser
  build               Generate static HTML preview
  check               Run README validation
  init                Scaffold README + CI setup

Global Options:
  -h, --help          Show help
  -v, --version       Show version

Preview Options:
  --file <path>       Markdown file (default: README.md)
  --port <number>     Preview port (default: 4173)
  --no-open           Do not open browser
  --theme <npm|github>
  --branch <name>     Git branch for raw URLs (default: HEAD)
  --base-url <url>    Override raw base URL
  --rewrite-links     Rewrite relative markdown links

Check Options:
  --strict            Enable strict validation rules

Init Options:
  --assets            Add placeholder assets/screenshot.png
  --workflow-only     Only create GitHub Action
  --readme-only       Only patch README
  --force             Overwrite existing files
  --workflow-name "<name>"  Custom workflow name

Examples:
  npx readme-preview
  npx readme-preview check --strict
  npx readme-preview init --assets
`);
}

/* ---------- RUN ---------- */

main().catch((err) => {
  console.error("❌ Unexpected error:");
  console.error(err);
  process.exit(1);
});
