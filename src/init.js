// src/init.js
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function readJsonSafe(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeFileSafe(path, content, { force }) {
  if (existsSync(path) && !force) return { written: false, reason: "exists" };
  writeFileSync(path, content, "utf8");
  return { written: true };
}

function guessRepoSlugFromPackageJson(cwd) {
  const pkg = readJsonSafe(join(cwd, "package.json"));
  const repo = pkg?.repository?.url || pkg?.repository;
  if (!repo) return { owner: "YOUR_USERNAME", name: "YOUR_REPO" };

  const m = String(repo).match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
  if (!m) return { owner: "YOUR_USERNAME", name: "YOUR_REPO" };
  return { owner: m[1], name: m[2] };
}

function workflowYaml({ workflowName }) {
  return `name: ${workflowName}

on:
  pull_request:
  push:
    branches: [main]

jobs:
  readme-preview-check:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install deps
        run: npm ci

      - name: README checks
        run: npx readme-preview check --strict
`;
}

function readmePatchBlock({ owner, name }) {
  // No markdown fences here; caller inserts into README as plain text.
  return [
    "",
    "---",
    "",
    "## Badges",
    "",
    `![npm](https://img.shields.io/npm/v/readme-preview)`,
    `![downloads](https://img.shields.io/npm/dm/readme-preview)`,
    `![license](https://img.shields.io/npm/l/readme-preview)`,
    `![ci](https://github.com/${owner}/${name}/actions/workflows/readme-preview.yml/badge.svg)`,
    "",
    "---",
    "",
    "## Screenshot",
    "",
    "Add a screenshot at `./assets/screenshot.png` (relative images will be rewritten in preview):",
    "",
    "![Preview screenshot](./assets/screenshot.png)",
    "",
    "---",
    "",
    "## Quick Start",
    "",
    "```bash",
    "npx readme-preview",
    "```",
    "",
    "CI check:",
    "",
    "```bash",
    "npx readme-preview check --strict",
    "```",
    "",
  ].join("\n");
}

function addSectionIfMissing(readme, marker, block) {
  if (readme.includes(marker)) return { updated: false, content: readme };
  // Insert after first H1 + optional first paragraph; simplest: append.
  return { updated: true, content: readme.trimEnd() + "\n" + block };
}

const DEFAULT_README = `# readme-preview

Preview how your README renders on npm and GitHub before publishing.

## Install

\`\`\`bash
npx readme-preview
\`\`\`

## Usage

\`\`\`bash
npx readme-preview
npx readme-preview check --strict
\`\`\`
`;

const PLACEHOLDER_PNG_BASE64 =
  // 1x1 transparent PNG
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3Z5uQAAAAASUVORK5CYII=";

export async function runInit({
  cwd,
  force,
  workflowOnly,
  readmeOnly,
  addAssets,
  workflowName,
}) {
  const repo = guessRepoSlugFromPackageJson(cwd);

  const workflowPath = join(cwd, ".github", "workflows", "readme-preview.yml");
  const assetsDir = join(cwd, "assets");
  const screenshotPath = join(assetsDir, "screenshot.png");
  const readmePath = join(cwd, "README.md");

  let wroteAny = false;

  // 1) workflow
  if (!readmeOnly) {
    ensureDir(join(cwd, ".github", "workflows"));
    const res = writeFileSafe(workflowPath, workflowYaml({ workflowName }), {
      force,
    });
    if (res.written) {
      console.log(`✅ Wrote ${workflowPath}`);
      wroteAny = true;
    } else {
      console.log(
        `ℹ️ Skipped ${workflowPath} (already exists). Use --force to overwrite.`,
      );
    }
  }

  // 2) README patch or create
  if (!workflowOnly) {
    let readme = existsSync(readmePath)
      ? readFileSync(readmePath, "utf8")
      : DEFAULT_README;

    const block = readmePatchBlock(repo);
    const patched = addSectionIfMissing(readme, "## Badges", block);

    if (patched.updated || !existsSync(readmePath)) {
      const res = writeFileSafe(readmePath, patched.content + "\n", {
        force: force || !existsSync(readmePath),
      });
      if (res.written) {
        console.log(`✅ Wrote ${readmePath}`);
        wroteAny = true;
      } else {
        console.log(
          `ℹ️ Skipped ${readmePath} (already exists). Use --force to overwrite.`,
        );
      }
    } else {
      console.log(
        `ℹ️ README already contains badges section; no changes made.`,
      );
    }
  }

  // 3) optional assets
  if (addAssets) {
    ensureDir(assetsDir);
    if (!existsSync(screenshotPath) || force) {
      const buf = Buffer.from(PLACEHOLDER_PNG_BASE64, "base64");
      writeFileSync(screenshotPath, buf);
      console.log(`✅ Wrote ${screenshotPath} (placeholder image)`);
      wroteAny = true;
    } else {
      console.log(
        `ℹ️ Skipped ${screenshotPath} (already exists). Use --force to overwrite.`,
      );
    }
  }

  if (!wroteAny) {
    console.log("ℹ️ Nothing to do. Try --force to overwrite existing files.");
  } else {
    console.log("✅ Init complete.");
  }
}
